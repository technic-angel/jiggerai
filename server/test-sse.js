import fetch from 'node-fetch';

const testMessage = "Hello Jigger! Tell me about yourself in 1 sentence.";

console.log('🧪 Testing SSE endpoint...\n');
console.log(`📤 Sending message: "${testMessage}"\n`);

const response = await fetch('http://localhost:5001/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'dev-user-001',
    sessionId: 'test-session-001',
    message: testMessage,
  }),
});

console.log(`📥 Response Status: ${response.status}`);
console.log(`📥 Content-Type: ${response.headers.get('content-type')}\n`);

// Parse SSE stream
const text = await response.text();
const lines = text.split('\n');
let eventCount = 0;
let fullResponse = '';

console.log('--- SSE STREAM OUTPUT ---\n');

for (const line of lines) {
  if (!line.startsWith('data: ')) continue;
  eventCount++;
  const payload = JSON.parse(line.slice(6));

  if (payload.type === 'token') {
    process.stdout.write(payload.text);
    fullResponse += payload.text;
  } else if (payload.type === 'done') {
    console.log('\n\n✅ Stream completed!');
  } else if (payload.type === 'error') {
    console.log(`\n❌ Error: ${payload.message}`);
  }
}

console.log(`\n--- SUMMARY ---`);
console.log(`✅ Total events received: ${eventCount}`);
console.log(`📝 Full response length: ${fullResponse.length} characters`);
console.log(`✅ Test complete!\n`);
