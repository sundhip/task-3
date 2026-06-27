// native global fetch is used (built-in in Node 18+)
import { spawn } from 'child_process';
import path from 'path';

const API_BASE = 'http://localhost:5000/api/tasks';
const API_V1_BASE = 'http://localhost:5000/api/v1/tasks';

async function runTests() {
  console.log('--- Starting TaskFlow API verification ---');

  // 1. Get initial tasks
  console.log('\n1. Testing GET /api/tasks (Initial)...');
  const res1 = await fetch(API_BASE);
  const data1 = await res1.json();
  console.log('Status:', res1.status); // 200
  console.log('Body:', data1); // []
  if (res1.status !== 200 || !Array.isArray(data1) || data1.length !== 0) {
    throw new Error('Initial GET failed');
  }

  // Check security headers
  console.log('X-Content-Type-Options:', res1.headers.get('x-content-type-options'));
  console.log('X-Frame-Options:', res1.headers.get('x-frame-options'));
  console.log('Strict-Transport-Security:', res1.headers.get('strict-transport-security'));
  if (
    res1.headers.get('x-content-type-options') !== 'nosniff' ||
    res1.headers.get('x-frame-options') !== 'DENY' ||
    !res1.headers.get('strict-transport-security')
  ) {
    throw new Error('Security headers verification failed');
  }

  // 2. Create a valid task
  console.log('\n2. Testing POST /api/tasks (Valid)...');
  const res2 = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Learn Node.js & Express' })
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status); // 201
  console.log('Body:', data2);
  if (res2.status !== 201 || data2.id !== 1 || data2.text !== 'Learn Node.js & Express' || data2.completed !== false) {
    throw new Error('Create valid task failed');
  }

  // 3. Create an invalid task (short text)
  console.log('\n3. Testing POST /api/tasks (Invalid - short text)...');
  const res3 = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'ab' })
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status); // 400
  console.log('Body:', data3);
  if (res3.status !== 400 || !data3.error || !data3.error.includes('at least 3 characters')) {
    throw new Error('Validation for short text failed');
  }

  // 4. Create an invalid task (empty text)
  console.log('\n4. Testing POST /api/tasks (Invalid - empty text)...');
  const res4 = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '' })
  });
  const data4 = await res4.json();
  console.log('Status:', res4.status); // 400
  console.log('Body:', data4);
  if (res4.status !== 400 || !data4.error || !data4.error.includes('required')) {
    throw new Error('Validation for empty text failed');
  }

  // 5. Get task by ID (Valid)
  console.log('\n5. Testing GET /api/tasks/1...');
  const res5 = await fetch(`${API_BASE}/1`);
  const data5 = await res5.json();
  console.log('Status:', res5.status); // 200
  console.log('Body:', data5);
  if (res5.status !== 200 || data5.id !== 1 || data5.text !== 'Learn Node.js & Express') {
    throw new Error('GET task by ID failed');
  }

  // 6. Get task by ID using versioned URL (GET /api/v1/tasks/1)
  console.log('\n6. Testing GET /api/v1/tasks/1...');
  const res6 = await fetch(`${API_V1_BASE}/1`);
  const data6 = await res6.json();
  console.log('Status:', res6.status); // 200
  console.log('Body:', data6);
  if (res6.status !== 200 || data6.id !== 1) {
    throw new Error('GET task by ID via v1 URL failed');
  }

  // 7. Update task (Valid - Mark Completed)
  console.log('\n7. Testing PUT /api/tasks/1 (Valid)...');
  const res7 = await fetch(`${API_BASE}/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true })
  });
  const data7 = await res7.json();
  console.log('Status:', res7.status); // 200
  console.log('Body:', data7);
  if (res7.status !== 200 || data7.completed !== true || data7.text !== 'Learn Node.js & Express') {
    throw new Error('Update task completed flag failed');
  }

  // 8. Update task (Invalid - Short Text)
  console.log('\n8. Testing PUT /api/tasks/1 (Invalid - short text)...');
  const res8 = await fetch(`${API_BASE}/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'xy' })
  });
  const data8 = await res8.json();
  console.log('Status:', res8.status); // 400
  console.log('Body:', data8);
  if (res8.status !== 400 || !data8.error) {
    throw new Error('Update task validation failed');
  }

  // 9. Update task (Invalid - Not Found)
  console.log('\n9. Testing PUT /api/tasks/999...');
  const res9 = await fetch(`${API_BASE}/999`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Testing Not Found' })
  });
  const data9 = await res9.json();
  console.log('Status:', res9.status); // 404
  console.log('Body:', data9);
  if (res9.status !== 404 || data9.error !== 'Task not found') {
    throw new Error('Update non-existent task failed to return 404');
  }

  // 10. Delete task (Valid)
  console.log('\n10. Testing DELETE /api/tasks/1...');
  const res10 = await fetch(`${API_BASE}/1`, {
    method: 'DELETE'
  });
  console.log('Status:', res10.status); // 204
  if (res10.status !== 204) {
    throw new Error('Delete task failed');
  }

  // 11. Delete task (Invalid - Not Found / Already Deleted)
  console.log('\n11. Testing DELETE /api/tasks/1 (Already deleted)...');
  const res11 = await fetch(`${API_BASE}/1`, {
    method: 'DELETE'
  });
  const data11 = await res11.json();
  console.log('Status:', res11.status); // 404
  console.log('Body:', data11);
  if (res11.status !== 404 || data11.error !== 'Task not found') {
    throw new Error('DELETE non-existent task failed to return 404');
  }

  // 12. Get all tasks (Final - empty)
  console.log('\n12. Testing GET /api/tasks (Final)...');
  const res12 = await fetch(API_BASE);
  const data12 = await res12.json();
  console.log('Status:', res12.status); // 200
  console.log('Body:', data12); // []
  if (res12.status !== 200 || data12.length !== 0) {
    throw new Error('Final GET verification failed');
  }

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

// Start API server in background, run tests, and kill server
function run() {
  console.log('Spawning API server...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: 'D:\\taskflow-api',
    env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`);
  });

  // Wait 1.5s for server to start, then run tests
  setTimeout(async () => {
    try {
      await runTests();
      serverProcess.kill('SIGINT');
      process.exit(0);
    } catch (err) {
      console.error('\n*** TEST FAILURE ***');
      console.error(err);
      serverProcess.kill('SIGINT');
      process.exit(1);
    }
  }, 1500);
}

run();
