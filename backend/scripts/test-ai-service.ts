import { generateAIResponse } from '../src/services/aiService.js';

async function testAIService() {
  console.log('🧪 Testing AI Service...\n');

  const testCases = [
    'I have a severe headache that started this morning.',
    'I have been coughing for 3 days with fever.',
    'My chest hurts when I breathe deeply.',
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`👤 User: ${testCase}`);
    console.log('🤖 AI Response:');
    console.log('-'.repeat(80));

    try {
      const response = await generateAIResponse(testCase, []);
      console.log(response);
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Test complete!');
  process.exit(0);
}

testAIService();
