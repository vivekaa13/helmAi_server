const vectorService = require('../services/openSearchService');

// Store user intent history (in production, use Redis or database)
const userIntentHistory = new Map();

const addToIntentHistory = (userId, intent) => {
    if (!userIntentHistory.has(userId)) {
        userIntentHistory.set(userId, []);
    }
    
    const history = userIntentHistory.get(userId);
    history.push(intent);
    
    // Keep only last 5 intents
    if (history.length > 5) {
        history.shift();
    }
    
    userIntentHistory.set(userId, history);
};

const getIntentHistory = (userId) => {
    return userIntentHistory.get(userId) || [];
};

const cancelBooking = () => {
    console.log("🎯 Processing booking cancellation...");
    console.log("✅ Booking cancelled successfully");
    
    return {
        responseText: "Cancellation Successful",
        screenAction: {},
        data: {}
    };
};

const generateResponseByIntent = (intent, text, userId, context) => {
    const baseResponse = {
        success: true,
        intent: intent,
        userId: userId
    };

    switch (intent) {
        case 'flight_booking':
            return {
                ...baseResponse,
                responseText: "I found flights from New York to Miami for tomorrow. Here are your options:",
                screenAction: {
                    navigateTo: "BookScreen",
                    showSection: "flight_results"
                },
                data: {
                    flights: [
                        {
                            flightId: "AA123",
                            airline: "American Airlines",
                            departure: {
                                time: "08:00 AM",
                                airport: "JFK",
                                date: "2025-08-21"
                            },
                            arrival: {
                                time: "11:30 AM",
                                airport: "MIA",
                                date: "2025-08-21"
                            },
                            price: "$299",
                            duration: "3h 30m",
                            stops: "Direct"
                        },
                        {
                            flightId: "AA456",
                            airline: "American Airlines",
                            departure: {
                                time: "02:15 PM",
                                airport: "LGA",
                                date: "2025-08-21"
                            },
                            arrival: {
                                time: "05:45 PM",
                                airport: "MIA",
                                date: "2025-08-21"
                            },
                            price: "$349",
                            duration: "3h 30m",
                            stops: "Direct"
                        }
                    ],
                    searchParams: {
                        origin: "New York",
                        destination: "Miami",
                        departureDate: "2025-08-21",
                        passengers: 1
                    }
                },
                nextStep: {
                    expectedInput: "flight_selection",
                    prompt: "Which flight would you like to book?"
                }
            };

        case 'flight_cancellation':
            return {
                ...baseResponse,
                responseText: "I can help you cancel your flight. Please provide your confirmation number so I can locate your booking.",
                screenAction: {
                    navigateTo: "TripsScreen",
                    showSection: "confirmation_input"
                },
                data: {},
                nextStep: {
                    expectedInput: "confirmation_number",
                    prompt: "Please say your confirmation number"
                }
            };

        case 'flight_change':
            return {
                ...baseResponse,
                responseText: "I can help you change your flight. Please provide your confirmation number and I'll show you available options.",
                screenAction: {
                    navigateTo: "RescheduleScreen",
                    showSection: "confirmation_input"
                },
                data: {},
                nextStep: {
                    expectedInput: "confirmation_number",
                    prompt: "Please provide your booking confirmation number"
                }
            };

        case 'flight_checkin':
            return {
                ...baseResponse,
                responseText: "I can help you check in for your flight. Please provide your confirmation number or last name to get started.",
                screenAction: {
                    navigateTo: "CheckinScreen",
                    showSection: "checkin_input"
                },
                data: {},
                nextStep: {
                    expectedInput: "checkin_details",
                    prompt: "Please say your confirmation number or last name"
                }
            };

        case 'baggage_inquiry':
            return {
                ...baseResponse,
                responseText: "I can help you with baggage information. Are you looking to track your baggage, learn about baggage policies, or file a claim?",
                screenAction: {
                    navigateTo: "BaggageScreen",
                    showSection: "baggage_options"
                },
                data: {},
                nextStep: {
                    expectedInput: "baggage_action",
                    prompt: "What would you like to do regarding baggage?"
                }
            };

        case 'flight_status':
            return {
                ...baseResponse,
                responseText: "I can check your flight status. Please provide your flight number or confirmation number.",
                screenAction: {
                    navigateTo: "StatusScreen",
                    showSection: "status_input"
                },
                data: {},
                nextStep: {
                    expectedInput: "flight_identifier",
                    prompt: "Please say your flight number or confirmation number"
                }
            };

        case 'seat_selection':
            return {
                ...baseResponse,
                responseText: "I can help you select or change your seat. Please provide your confirmation number to view available seats.",
                screenAction: {
                    navigateTo: "SeatScreen",
                    showSection: "seat_map"
                },
                data: {},
                nextStep: {
                    expectedInput: "confirmation_number",
                    prompt: "Please provide your booking confirmation number"
                }
            };

        case 'payment_inquiry':
            return {
                ...baseResponse,
                responseText: "I can help you with payment-related questions including refunds, payment methods, and billing issues. What specific payment assistance do you need?",
                screenAction: {
                    navigateTo: "PaymentScreen",
                    showSection: "payment_options"
                },
                data: {},
                nextStep: {
                    expectedInput: "payment_issue",
                    prompt: "Please describe your payment-related question"
                }
            };

        case 'special_assistance':
            return {
                ...baseResponse,
                responseText: "I can help you arrange special assistance including wheelchair service, dietary requirements, or other accessibility needs. What assistance do you require?",
                screenAction: {
                    navigateTo: "AssistanceScreen",
                    showSection: "assistance_options"
                },
                data: {},
                nextStep: {
                    expectedInput: "assistance_type",
                    prompt: "What type of special assistance do you need?"
                }
            };

        case 'connecting_flights':
            return {
                ...baseResponse,
                responseText: "I can help you with connecting flight information including layover details, terminal changes, and connection assistance. What would you like to know?",
                screenAction: {
                    navigateTo: "ConnectionScreen",
                    showSection: "connection_info"
                },
                data: {},
                nextStep: {
                    expectedInput: "connection_question",
                    prompt: "What connecting flight information do you need?"
                }
            };

        case 'loyalty_program':
            return {
                ...baseResponse,
                responseText: "I can help you with frequent flyer program questions including miles balance, status, upgrades, and redemptions. What would you like to know about your loyalty account?",
                screenAction: {
                    navigateTo: "LoyaltyScreen",
                    showSection: "loyalty_info"
                },
                data: {},
                nextStep: {
                    expectedInput: "loyalty_question",
                    prompt: "What loyalty program information do you need?"
                }
            };

        case 'travel_documents':
            return {
                ...baseResponse,
                responseText: "I can help you with travel document requirements including passport, visa, and ID information for your destination. Where are you traveling to?",
                screenAction: {
                    navigateTo: "DocumentsScreen",
                    showSection: "document_requirements"
                },
                data: {},
                nextStep: {
                    expectedInput: "destination",
                    prompt: "What destination do you need document information for?"
                }
            };

        case 'weather_related':
            return {
                ...baseResponse,
                responseText: "I can help you with weather-related flight information including delays, cancellations, and rebooking options due to weather conditions. What weather information do you need?",
                screenAction: {
                    navigateTo: "WeatherScreen",
                    showSection: "weather_updates"
                },
                data: {},
                nextStep: {
                    expectedInput: "weather_question",
                    prompt: "What weather-related assistance do you need?"
                }
            };

        case 'pricing_inquiry':
            return {
                ...baseResponse,
                responseText: "I can help you with pricing information including fare details, discounts, and price comparisons. What pricing information are you looking for?",
                screenAction: {
                    navigateTo: "PricingScreen",
                    showSection: "price_info"
                },
                data: {},
                nextStep: {
                    expectedInput: "pricing_question",
                    prompt: "What pricing information do you need?"
                }
            };

        case 'general_inquiry':
            return {
                ...baseResponse,
                responseText: "I can help you with flight booking, rescheduling, baggage tracking, or other airline services. What would you like to do?",
                screenAction: {
                    navigateTo: "HomeScreen",
                    showSection: "voice_options"
                },
                data: {},
                nextStep: {
                    expectedInput: "service_selection",
                    prompt: "Please tell me what you'd like help with"
                }
            };

        case 'others':
        default:
            return {
                ...baseResponse,
                intent: 'general_inquiry',
                responseText: "I can help you with various airline services including booking flights, managing reservations, checking flight status, and baggage assistance. How can I help you today?",
                screenAction: {
                    navigateTo: "HomeScreen",
                    showSection: "voice_options"
                },
                data: {},
                nextStep: {
                    expectedInput: "service_selection",
                    prompt: "What airline service do you need help with?"
                }
            };
    }
};

const processVoice = async (req, res) => {
    try {
        const { text, userId, context = {} } = req.body;
        
        if (!text) {
            return res.status(400).json({
                error: 'Text is required'
            });
        }

        // Check for confirmation number first, before intent recognition
        if (text.toLowerCase().includes('confirmation number') || 
            text.toLowerCase().includes('confirmation code') ||
            text.toLowerCase().includes('booking reference') ||
            /\b[A-Z]{2,}\d{2,}\b/.test(text) || // Matches patterns like ABC123, AA456
            /\b\d{6,}\b/.test(text)) { // Matches 6+ digit numbers
            
            const recentIntents = getIntentHistory(userId);
            const hasCancellationIntent = recentIntents.includes('flight_cancellation');
            const hasChangeIntent = recentIntents.includes('flight_change');
            const hasCheckinIntent = recentIntents.includes('flight_checkin');
            
            if (hasCancellationIntent) {
                console.log(`🔍 User ${userId} provided confirmation number for cancellation`);
                const cancellationResult = cancelBooking();
                
                return res.json({
                    success: true,
                    intent: 'booking_cancellation_confirmed',
                    userId: userId,
                    responseText: cancellationResult.responseText,
                    screenAction: cancellationResult.screenAction,
                    data: cancellationResult.data,
                    nextStep: {
                        expectedInput: "cancellation_complete",
                        prompt: "Your booking has been cancelled. Is there anything else I can help you with?"
                    }
                });
            }
            
            if (hasChangeIntent) {
                console.log(`🔍 User ${userId} provided confirmation number for flight change`);
                return res.json({
                    success: true,
                    intent: 'flight_change_confirmed',
                    userId: userId,
                    responseText: "I found your booking. Here are available alternative flights:",
                    screenAction: {
                        navigateTo: "RescheduleScreen",
                        showSection: "available_flights"
                    },
                    data: {
                        originalBooking: {
                            confirmationNumber: "ABC123",
                            flightNumber: "AA456",
                            route: "JFK → MIA",
                            originalDate: "2025-08-21"
                        },
                        alternativeFlights: []
                    },
                    nextStep: {
                        expectedInput: "flight_selection",
                        prompt: "Which new flight would you like to select?"
                    }
                });
            }
            
            if (hasCheckinIntent) {
                console.log(`🔍 User ${userId} provided confirmation number for check-in`);
                return res.json({
                    success: true,
                    intent: 'checkin_confirmed',
                    userId: userId,
                    responseText: "Found your booking! You can now check in for your flight.",
                    screenAction: {
                        navigateTo: "CheckinScreen",
                        showSection: "checkin_details"
                    },
                    data: {
                        booking: {
                            confirmationNumber: "ABC123",
                            passengerName: "John Doe",
                            flightNumber: "AA456",
                            route: "JFK → MIA",
                            date: "2025-08-21",
                            time: "08:00 AM"
                        }
                    },
                    nextStep: {
                        expectedInput: "checkin_complete",
                        prompt: "Would you like to select seats or complete check-in?"
                    }
                });
            }
        }

        if (!vectorService.initialized) {
            await vectorService.initialize();
        }

        // Get intent from text similarity
        const intentResult = await vectorService.searchSimilarIntents(text, 0.3);
        const detectedIntent = intentResult.intent;

        // Add detected intent to user's history (before generating response)
        addToIntentHistory(userId, detectedIntent);

        // Generate response based on detected intent
        const response = generateResponseByIntent(detectedIntent, text, userId, context);
        
        res.json(response);
    } catch (error) {
        console.error('Error processing voice:', error);
        res.status(500).json({
            error: 'Failed to process voice input',
            details: error.message
        });
    }
};

module.exports = {
    processVoice
};
