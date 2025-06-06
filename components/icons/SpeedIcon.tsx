
import React from 'react';

const SpeedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /> {/* Basic chevron > */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75V12m0 0H9.75M12 12H14.25M12 12V14.25m6-4.5v-1.5c0-.621.504-1.125 1.125-1.125H21M4.5 10.5H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125H4.5m15-3H18a2.25 2.25 0 00-2.25 2.25v.01c0 1.242 1.008 2.25 2.25 2.25h1.5a2.25 2.25 0 002.25-2.25v-.01c0-1.242-1.008-2.25-2.25-2.25zM4.5 10.5H6A2.25 2.25 0 018.25 12.75v.01c0 1.242-1.008 2.25-2.25 2.25H4.5A2.25 2.25 0 012.25 12.75v-.01C2.25 11.508 3.258 10.5 4.5 10.5zM12 6.75V4.5m0 15V17.25m0-5.25a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);
export default SpeedIcon;
