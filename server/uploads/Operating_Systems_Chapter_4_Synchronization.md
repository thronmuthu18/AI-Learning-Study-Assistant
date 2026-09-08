# Chapter 4: Process Synchronization & Concurrency

## 4.1 The Critical-Section Problem
A critical section is a piece of code that accesses shared resources (such as common variables or files) that must not be concurrently accessed by more than one thread of execution.

A valid solution to the critical-section problem must satisfy three requirements:
1. **Mutual Exclusion**: If process Pi is executing in its critical section, then no other processes can be executing in their critical sections.
2. **Progress**: If no process is executing in its critical section and there exist some processes that wish to enter their critical section, then the selection of the next process cannot be postponed indefinitely.
3. **Bounded Waiting**: There must be a bound or limit on the number of times that other processes are allowed to enter their critical sections after a process has made a request to enter and before that request is granted.

## 4.2 Semaphores and Mutex Locks
A mutex (mutual exclusion) lock is a synchronization primitive used to protect critical sections and prevent race conditions. A process must acquire the lock before entering a critical section, and release the lock when it exits.

A semaphore is a synchronization tool that provides more sophisticated ways for processes to synchronize their activities. An integer variable S that, apart from initialization, is accessed only through two standard atomic operations: `wait()` (or `P()`) and `signal()` (or `V()`).
- **Counting Semaphores**: Integer value can range over an unrestricted domain. Used to control access to a given resource consisting of a finite number of instances.
- **Binary Semaphores**: Integer value can range only between 0 and 1. Behavior is identical to a mutex lock.

## 4.3 Classic Problems of Synchronization
1. **Bounded-Buffer (Producer-Consumer) Problem**: Producers generate items and put them into a shared buffer, while consumers take items out. Semaphores `mutex`, `empty`, and `full` ensure no buffer overflow or underflow occurs.
2. **Readers-Writers Problem**: Allows multiple readers to read shared data concurrently, but only one writer to modify it with exclusive access.
3. **Dining-Philosophers Problem**: Illustrates allocation of several resources among several processes in a deadlock-free and starvation-free manner.

## 4.4 Deadlocks
A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process in the set.

### The Four Necessary Conditions for Deadlock (Coffman Conditions):
1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.
2. **Hold and Wait**: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. **No Preemption**: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it.
4. **Circular Wait**: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.

### Handling Deadlocks:
- **Deadlock Prevention**: Disallow at least one of the four necessary Coffman conditions.
- **Deadlock Avoidance**: The Banker's Algorithm uses resource-allocation state knowledge (available, max, allocation, need) to ensure the system never enters an unsafe state.
- **Deadlock Detection and Recovery**: Periodically check wait-for graphs and preempt or terminate processes to break cycles.
