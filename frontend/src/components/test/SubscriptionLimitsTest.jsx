import React, { useState, useEffect } from 'react';
import { subscriptionApi } from '../../api';
import { checkFileSizeLimit, checkUserCountLimit, formatFileSize } from '../../utils/subscriptionLimits';
import { Crown, AlertCircle, CheckCircle } from 'lucide-react';

const SubscriptionLimitsTest = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    fetchSubscriptionStatus();
    runTests();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await subscriptionApi.getStatus();
      if (response.success) {
        setSubscriptionStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const runTests = () => {
    const results = [];
    
    // Test file size limits
    const testFiles = [
      { name: '5MB-file.jpg', size: 5 * 1024 * 1024 },
      { name: '15MB-file.jpg', size: 15 * 1024 * 1024 },
      { name: '50MB-file.jpg', size: 50 * 1024 * 1024 },
      { name: '150MB-file.jpg', size: 150 * 1024 * 1024 }
    ];

    testFiles.forEach(file => {
      const freeCheck = checkFileSizeLimit(file, false);
      const subscribedCheck = checkFileSizeLimit(file, true);
      
      results.push({
        type: 'File Size',
        test: `${file.name} (${formatFileSize(file.size)})`,
        freeResult: freeCheck.valid ? 'PASS' : 'FAIL',
        freeMessage: freeCheck.error || 'Allowed',
        subscribedResult: subscribedCheck.valid ? 'PASS' : 'FAIL',
        subscribedMessage: subscribedCheck.error || 'Allowed'
      });
    });

    // Test user count limits
    const userCountTests = [
      { role: 'editor', currentCount: 0, desc: 'Create 1st editor' },
      { role: 'editor', currentCount: 1, desc: 'Create 2nd editor' },
      { role: 'editor', currentCount: 5, desc: 'Create 6th editor' },
      { role: 'editor', currentCount: 10, desc: 'Create 11th editor' }
    ];

    userCountTests.forEach(test => {
      const freeCheck = checkUserCountLimit(test.currentCount, test.role, false);
      const subscribedCheck = checkUserCountLimit(test.currentCount, test.role, true);
      
      results.push({
        type: 'User Count',
        test: test.desc,
        freeResult: freeCheck.valid ? 'PASS' : 'FAIL',
        freeMessage: freeCheck.error || 'Allowed',
        subscribedResult: subscribedCheck.valid ? 'PASS' : 'FAIL',
        subscribedMessage: subscribedCheck.error || 'Allowed'
      });
    });

    setTestResults(results);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Subscription Limits Test</h1>
      
      {/* Current Subscription Status */}
      {subscriptionStatus && (
        <div className={`p-4 rounded-lg border mb-6 ${
          subscriptionStatus.hasActiveSubscription 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-orange-50 border-orange-200 text-orange-800'
        }`}>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            <span className="font-medium">
              Current Plan: {subscriptionStatus.hasActiveSubscription ? 'Premium' : 'Free'}
            </span>
          </div>
          {subscriptionStatus.subscription && (
            <div className="mt-2 text-sm">
              <p>Type: {subscriptionStatus.subscription.subscriptionType}</p>
              <p>Expires: {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString('en-GB')}</p>
            </div>
          )}
        </div>
      )}

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Validation Test Results</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Free Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {testResults.map((result, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.test}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {result.freeResult === 'PASS' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={result.freeResult === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                        {result.freeResult}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{result.freeMessage}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {result.subscribedResult === 'PASS' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={result.subscribedResult === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                        {result.subscribedResult}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{result.subscribedMessage}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Free Plan Limits</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• File uploads: Up to 10MB per file</li>
            <li>• Users: 1 admin + 1 editor maximum</li>
            <li>• Storage: Limited</li>
          </ul>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">Premium Plan Limits</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• File uploads: Up to 100MB per file</li>
            <li>• Users: 1 admin + 10 editors maximum</li>
            <li>• Storage: Unlimited</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLimitsTest;