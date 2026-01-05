// Quick debug script to test if token is being passed
import { runComplianceTests } from './dist/index.js';

const token = 'sk_L8lf5l9y1lIE6R8uw01sR1gPwqasJcQbhzT40ykMO1g';
console.log('Testing with token:', token);

try {
  const groups = await runComplianceTests('http://localhost:8085/v1', {
    authToken: token,
    timeout: 10000,
  });
  
  console.log('Test completed');
  console.log('Groups:', groups.length);
} catch (error) {
  console.error('Error:', error.message);
}
