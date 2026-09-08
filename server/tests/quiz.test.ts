import request from 'supertest';
import app from '../src/server';
import User from '../src/models/User';
import Course from '../src/models/Course';
import Quiz from '../src/models/Quiz';
import QuizAttempt from '../src/models/QuizAttempt';

describe('Quiz Generation, Evaluation & Attempt Scoring', () => {
  let token: string;
  let userId: string;
  let courseId: string;

  beforeEach(async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Quiz Student',
      email: 'quizstudent@example.com',
      password: 'password123',
    });
    token = reg.body.token;
    userId = reg.body.user.id;

    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Distributed Systems' });
    courseId = courseRes.body.course._id;
  });

  it('should generate a structured quiz using AI', async () => {
    const res = await request(app)
      .post('/api/quizzes/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Process Scheduling',
        courseId,
        difficulty: 'medium',
        questionCount: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.quiz.title).toBeDefined();
    expect(res.body.quiz.questions.length).toBeGreaterThanOrEqual(1);
    expect(res.body.quiz.questions[0].correctAnswer).toBeDefined();
  });

  it('should evaluate submitted answers, compute percentage, and identify weak topics', async () => {
    const quiz = await Quiz.create({
      userId,
      courseId,
      title: 'Operating Systems Quick Check',
      difficulty: 'medium',
      topics: ['Semaphores', 'Deadlocks'],
      questions: [
        {
          questionIndex: 0,
          type: 'mcq',
          question: 'What is a binary semaphore?',
          options: ['A lock with 0 or 1', 'A memory pointer', 'A CPU register', 'A disk partition'],
          correctAnswer: 'A lock with 0 or 1',
          explanation: 'Binary semaphore has value 0 or 1.',
          difficulty: 'easy',
          topic: 'Semaphores',
        },
        {
          questionIndex: 1,
          type: 'true_false',
          question: 'Deadlocks can occur with 3 Coffman conditions.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'All 4 conditions must hold simultaneously.',
          difficulty: 'medium',
          topic: 'Deadlocks',
        },
      ],
      totalQuestions: 2,
    });

    // Submit 1 correct and 1 incorrect answer
    const res = await request(app)
      .post(`/api/quizzes/${quiz._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionIndex: 0, selectedAnswer: 'A lock with 0 or 1' }, // Correct
          { questionIndex: 1, selectedAnswer: 'True' }, // Incorrect
        ],
        timeSpentSeconds: 45,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.score).toBe(1);
    expect(res.body.summary.totalQuestions).toBe(2);
    expect(res.body.summary.percentage).toBe(50);
    expect(res.body.summary.weakTopics).toContain('Deadlocks');
    expect(res.body.summary.strongTopics).toContain('Semaphores');

    // Verify stored attempt
    const attempt = await QuizAttempt.findOne({ quizId: quiz._id });
    expect(attempt).not.toBeNull();
    expect(attempt?.percentage).toBe(50);
  });
});
