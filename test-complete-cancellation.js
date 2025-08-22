const axios = require('axios');

const testCancellationFlowWithLambda = async () => {
    const baseUrl = 'http://127.0.0.1:3000';
    
    try {
        console.log('🧪 Testing complete cancellation flow with Lambda integration...\n');
        
        // Step 1: Request cancellation
        console.log('Step 1: User says "I want to cancel my flight"');
        const step1Response = await axios.post(`${baseUrl}/api/voice/process`, {
            text: "I want to cancel my flight",
            userId: "USER001"
        });
        
        console.log('Response:', JSON.stringify(step1Response.data, null, 2));
        console.log('\n---\n');
        
        // Step 2: Provide confirmation number (should trigger both Lambda calls)
        console.log('Step 2: User provides confirmation number (triggers Lambda calls)');
        console.log('Expected flow:');
        console.log('  1. Get trips from Lambda 1 (fetch trips)');
        console.log('  2. Extract bookingId from earliest trip');
        console.log('  3. Call Lambda 2 (cancel booking) with bookingId');
        console.log('  4. Return success response with flight details\n');
        
        const step2Response = await axios.post(`${baseUrl}/api/voice/process`, {
            text: "My confirmation number is ABC123",
            userId: "USER001"
        });
        
        console.log('Final Response:', JSON.stringify(step2Response.data, null, 2));
        console.log('\n✅ Complete cancellation test completed successfully!');
        
        // Verify the response structure
        if (step2Response.data.intent === 'booking_cancellation_confirmed' &&
            step2Response.data.data.cancelledFlight) {
            console.log('\n🎯 Verification: Response structure is correct');
            console.log(`   - Cancelled flight: ${step2Response.data.data.cancelledFlight.flight}`);
            console.log(`   - Route: ${step2Response.data.data.cancelledFlight.route}`);
            console.log(`   - Confirmation: ${step2Response.data.data.cancelledFlight.confirmationNumber}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.status) {
            console.error(`HTTP Status: ${error.response.status}`);
        }
    }
};

// Run the test
testCancellationFlowWithLambda();
