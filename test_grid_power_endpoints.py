#!/usr/bin/env python3
"""
Test script for Grid Power Input endpoints
Tests the new manual grid power input functionality
"""

import requests
import json
import sys
import time

# Backend URL
BASE_URL = "http://localhost:5000"

def test_endpoint(method, url, data=None):
    """Test a single endpoint"""
    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=data)
        
        print(f"{method} {url}")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("-" * 50)
        return response.json()
    except Exception as e:
        print(f"Error testing {method} {url}: {e}")
        return None

def main():
    print("🧪 Testing Grid Power Input Endpoints")
    print("=" * 50)
    
    # Test 1: Get initial grid power state
    print("1. Getting initial grid power state...")
    result = test_endpoint('GET', f"{BASE_URL}/api/grid/power")
    
    # Test 2: Get grid status
    print("2. Getting grid status...")
    test_endpoint('GET', f"{BASE_URL}/api/grid/status")
    
    # Test 3: Set grid power values
    print("3. Setting grid power values...")
    grid_data = {
        "voltage": 230.0,
        "current": 15.5,
        "status": 1,
        "frequency": 50.2
    }
    test_endpoint('POST', f"{BASE_URL}/api/grid/power", grid_data)
    
    # Test 4: Get updated grid power state
    print("4. Getting updated grid power state...")
    test_endpoint('GET', f"{BASE_URL}/api/grid/power")
    
    # Test 5: Get updated grid status
    print("5. Getting updated grid status...")
    test_endpoint('GET', f"{BASE_URL}/api/grid/status")
    
    # Test 6: Set specific power value (overriding calculation)
    print("6. Setting specific power value...")
    power_data = {
        "power": 5.5,
        "voltage": 220.0,
        "current": 25.0,
        "status": 1
    }
    test_endpoint('POST', f"{BASE_URL}/api/grid/power", power_data)
    
    # Test 7: Test power calculation
    print("7. Testing automatic power calculation...")
    calc_data = {
        "voltage": 240.0,
        "current": 20.0,
        "status": 1
    }
    test_endpoint('POST', f"{BASE_URL}/api/grid/power", calc_data)
    
    # Test 8: Reset grid power
    print("8. Resetting grid power to defaults...")
    test_endpoint('POST', f"{BASE_URL}/api/grid/reset")
    
    # Test 9: Final state check
    print("9. Final grid power state...")
    test_endpoint('GET', f"{BASE_URL}/api/grid/power")
    
    print("\n✅ All endpoint tests completed!")
    print("\nEndpoint Summary:")
    print("- POST /api/grid/power - Set grid power values")
    print("- GET  /api/grid/power - Get current grid power values") 
    print("- GET  /api/grid/status - Get grid connection status")
    print("- POST /api/grid/reset - Reset to default values")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)