import request from 'supertest';
import app from '../src/server';
import User from '../src/models/User';
import Course from '../src/models/Course';
import StudySession from '../src/models/StudySession';
import LearningPlan from '../src/models/LearningPlan';
import LearningTask from '../src/models/LearningTask';
import Quiz from '../src/models/Quiz';
import QuizAttempt from '../src/models/QuizAttempt';

describe('Progress Analytics & Recommendation Engine', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Progress Learner',
      email: 'progress@example.com',
      password: 'password123',
    });
    token = reg.body.token;
    userId = reg.body.user.id;
  });

  it('should calculate accurate streak days from consecutive study sessions', async () => {
    // Add sessions for today and yesterday
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    await StudySession.create([
      {
        userId,
        sessionType: 'reading',
        durationMinutes: 30,
        activityDate: today,
      },
      {
        userId,
        sessionType: 'quiz',
        durationMinutes: 20,
        activityDate: yesterday,
      },
    ]);

    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.streakDays).toBe(2);
    expect(res.body.data.stats.totalStudyMinutes).toBe(50);
  });

  it('should generate explainable recommendations based on weak quiz topics and active plan tasks', async () => {
    const course = await Course.create({
      userId,
      title: 'Database Systems',
    });

    const quiz = await Quiz.create({
      userId,
      courseId: course._id,
      title: 'SQL & Indexing',
      difficulty: 'medium',
      questions: [],
    });

    // Create a quiz attempt with weak topic
    await QuizAttempt.create({
      quizId: quiz._id,
      userId,
      courseId: course._id,
      score: 1,
      totalQuestions: 4,
      percentage: 25,
      weakTopics: ['B-Tree Indexing'],
      strongTopics: [],
      answers: [
        { questionIndex: 0, questionText: 'Q1', selectedAnswer: 'A', correctAnswer: 'B', isCorrect: false, topic: 'B-Tree Indexing' },
        { questionIndex: 1, questionText: 'Q2', selectedAnswer: 'A', correctAnswer: 'B', isCorrect: false, topic: 'B-Tree Indexing' },
      ],
    });

    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    const btreeRec = res.body.data.recommendations.find((r: any) => r.topic.includes('B-Tree'));
    expect(btreeRec).toBeDefined();
    expect(btreeRec.category).toBe('revision');
  });
});
