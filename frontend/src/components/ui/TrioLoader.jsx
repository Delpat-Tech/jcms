import React, { useEffect } from 'react';

const TrioLoader = ({ 
  size = "40", 
  speed = "1.3", 
  color = "black",
  className = "" 
}) => {
  useEffect(() => {
    import('ldrs').then(({ trio }) => {
      trio.register();
    });
  }, []);

  return React.createElement('l-trio', {
    size,
    speed,
    color,
    className
  });
};

export default TrioLoader;
