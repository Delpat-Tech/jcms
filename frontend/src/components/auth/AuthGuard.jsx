import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../../utils/auth';

const AuthGuard = ({ children, requiredRole = null }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }

    // Check role if required
    if (requiredRole) {
      const user = getUser();
      const userRole = user?.role?.toLowerCase();
      
      if (!userRole) {
        navigate('/');
        return;
      }

      // Define role hierarchy
      const roleHierarchy = {
        'superadmin': 3,
        'admin': 2,
        'editor': 1
      };

      const requiredRoleLevel = roleHierarchy[requiredRole.toLowerCase()];
      const userRoleLevel = roleHierarchy[userRole];

      if (!userRoleLevel || userRoleLevel < requiredRoleLevel) {
        // Redirect to appropriate dashboard based on user role
        if (userRole === 'superadmin') {
          navigate('/superadmin/overview');
        } else if (userRole === 'admin') {
          navigate('/admin/overview');
        } else if (userRole === 'editor') {
          navigate('/user/overview');
        } else {
          navigate('/');
        }
        return;
      }
    }
  }, [navigate, requiredRole]);

  // Don't render children if not authenticated
  if (!isAuthenticated()) {
    return null;
  }

  // Don't render children if role check fails
  if (requiredRole) {
    const user = getUser();
    const userRole = user?.role?.toLowerCase();
    
    if (!userRole) {
      return null;
    }

    const roleHierarchy = {
      'superadmin': 3,
      'admin': 2,
      'editor': 1
    };

    const requiredRoleLevel = roleHierarchy[requiredRole.toLowerCase()];
    const userRoleLevel = roleHierarchy[userRole];

    if (!userRoleLevel || userRoleLevel < requiredRoleLevel) {
      return null;
    }
  }

  return children;
};

export default AuthGuard;
