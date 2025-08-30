/**
 * API Test Script
 * 
 * Dette script tester alle API endpoints lokalt
 */

async function testAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔄 Testing API endpoints...');
  console.log(`Base URL: ${baseUrl}\n`);

  // Test health endpoint
  console.log('1. Testing /api/health...');
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health endpoint working');
      console.log(`   Status: ${data.status}`);
      console.log(`   Environment: ${data.environment}`);
    } else {
      console.log(`❌ Health endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Health endpoint error: ${error.message}`);
  }

  // Test products filters endpoint
  console.log('\n2. Testing /api/products/filters...');
  try {
    const response = await fetch(`${baseUrl}/api/products/filters`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Filters endpoint working');
      console.log(`   Brands: ${data.brands?.length || 0}`);
      console.log(`   Categories: ${data.categories?.length || 0}`);
      console.log(`   Statuses: ${data.statuses?.length || 0}`);
      console.log(`   Types: ${data.types?.length || 0}`);
    } else {
      console.log(`❌ Filters endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Filters endpoint error: ${error.message}`);
  }

  // Test products list endpoint
  console.log('\n3. Testing /api/products...');
  try {
    const response = await fetch(`${baseUrl}/api/products?limit=5`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Products endpoint working');
      console.log(`   Items returned: ${data.items?.length || 0}`);
      console.log(`   Has more: ${data.hasMore}`);
      console.log(`   Next cursor: ${data.nextCursor ? 'Yes' : 'No'}`);
      
      if (data.items && data.items.length > 0) {
        const first = data.items[0];
        console.log(`   First product: ${first.name} (${first.sku})`);
        console.log(`   Price: ${first.basePrice || 'N/A'}`);
        console.log(`   Variants: ${first.variantCount}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Products endpoint failed: ${response.status}`);
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Products endpoint error: ${error.message}`);
  }

  // Test products with search
  console.log('\n4. Testing /api/products with search...');
  try {
    const response = await fetch(`${baseUrl}/api/products?search=phone&limit=3`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Products search working');
      console.log(`   Search results: ${data.items?.length || 0}`);
      
      if (data.items && data.items.length > 0) {
        data.items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.name} (${item.sku})`);
        });
      }
    } else {
      console.log(`❌ Products search failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Products search error: ${error.message}`);
  }

  // Test pagination
  console.log('\n5. Testing pagination...');
  try {
    const firstPage = await fetch(`${baseUrl}/api/products?limit=2`);
    if (firstPage.ok) {
      const firstData = await firstPage.json();
      console.log(`✅ First page: ${firstData.items?.length || 0} items`);
      
      if (firstData.nextCursor) {
        const secondPage = await fetch(`${baseUrl}/api/products?limit=2&cursor=${firstData.nextCursor}`);
        if (secondPage.ok) {
          const secondData = await secondPage.json();
          console.log(`✅ Second page: ${secondData.items?.length || 0} items`);
          
          // Verify different products
          if (firstData.items?.[0]?.id !== secondData.items?.[0]?.id) {
            console.log('✅ Pagination working correctly (different items)');
          } else {
            console.log('⚠️  Pagination might have issues (same items)');
          }
        } else {
          console.log(`❌ Second page failed: ${secondPage.status}`);
        }
      } else {
        console.log('⚠️  No next cursor available');
      }
    } else {
      console.log(`❌ First page failed: ${firstPage.status}`);
    }
  } catch (error) {
    console.log(`❌ Pagination test error: ${error.message}`);
  }

  console.log('\n🎉 API testing completed!');
}

// Run the test
testAPI().catch(console.error);
