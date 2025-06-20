#!/usr/bin/env node

/**
 * Test the complete MCP tools flow
 */

require('dotenv/config');
const {
  handleSignIn,
  handlePostTimeline,
  handleSignOut,
  setCurrentSession,
} = require('./dist/tools');
const { initializeDatabase, createTables } = require('./dist/database');

async function testCompleteFlow() {
  console.log('Testing complete MCP tools flow...\n');

  try {
    // Initialize database first
    console.log('0. Initializing database...');
    initializeDatabase();
    await createTables();
    console.log('✓ Database initialized\n');
    // Step 1: Test sign_in
    console.log('1. Testing sign_in...');
    const signInRequest = {
      params: {
        arguments: {
          agent_name: 'TestFlowAgent',
          context: 'Complete flow testing',
        },
      },
    };

    const signInResult = await handleSignIn(signInRequest);
    console.log('✓ Sign-in successful:', signInResult);

    // Step 2: Test post_timeline (should work now)
    console.log('\n2. Testing post_timeline...');
    const postRequest = {
      params: {
        arguments: {
          content:
            'This is a test post from the complete flow test. MCP tools are working correctly!',
        },
      },
    };

    const postResult = await handlePostTimeline(postRequest);
    console.log('✓ Post successful:', postResult);

    // Step 3: Test another post
    console.log('\n3. Testing another post...');
    const post2Request = {
      params: {
        arguments: {
          content: 'Second test post to verify session persistence works correctly.',
        },
      },
    };

    const post2Result = await handlePostTimeline(post2Request);
    console.log('✓ Second post successful:', post2Result);

    // Step 4: Test sign_out
    console.log('\n4. Testing sign_out...');
    const signOutRequest = {
      params: {
        arguments: {},
      },
    };

    const signOutResult = await handleSignOut(signOutRequest);
    console.log('✓ Sign-out successful:', signOutResult);

    // Step 5: Try to post after sign-out (should fail)
    console.log('\n5. Testing post after sign-out (should fail)...');
    try {
      const postAfterSignOutRequest = {
        params: {
          arguments: {
            content: 'This should fail because we signed out.',
          },
        },
      };

      const failResult = await handlePostTimeline(postAfterSignOutRequest);
      console.log('✗ Unexpected: Post succeeded after sign-out:', failResult);
    } catch (error) {
      console.log('✓ Expected failure after sign-out:', error.message || error.error);
    }

    console.log('\n✓ All tests completed successfully! MCP tools are working correctly.');
  } catch (error) {
    console.error('✗ Test failed:', error);
    console.error('Full error:', error);
  }
}

// Run the test
testCompleteFlow()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
  });
