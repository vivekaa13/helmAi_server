const axios = require('axios');

const testCancellationFlow = async () => {
    const baseUrl = 'http://127.0.0.1:3000';
    
    try {
        console.log('🧪 Testing cancellation flow with Lambda integration...\n');
        
        // Step 1: Request cancellation
        console.log('Step 1: User says "I want to cancel my flight"');
        const step1Response = await axios.post(`${baseUrl}/api/voice/process`, {
            text: "I want to cancel my flight",
            userId: "USER001"
        });
        
        console.log('Response:', JSON.stringify(step1Response.data, null, 2));
        console.log('\n---\n');
        
        // Step 2: Provide confirmation number (should trigger Lambda call)
        console.log('Step 2: User provides confirmation number');
        const step2Response = await axios.post(`${baseUrl}/api/voice/process`, {
            text: "My confirmation number is ABC123",
            userId: "USER001"
        });
        
        console.log('Response:', JSON.stringify(step2Response.data, null, 2));
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
};

// Run the test
testCancellationFlow();
