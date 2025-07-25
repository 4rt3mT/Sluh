
import React from 'react';

const NextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M3.75 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75V5.25Zm7.5 3a.75.75 0 0 1 .75.75v3.316l3.22-1.612a.75.75 0 0 1 1.06.672v5.448a.75.75 0 0 1-1.06.672L12 15.434v3.316a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
     <path d="M18 5.25a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0-.75.75v13.5A.75.75 0 0 0 6 19.5h11.25a.75.75 0 0 0 .75-.75V5.25ZM12.97 14.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 1 0-1.06 1.06L14.69 9.75H7.5a.75.75 0 0 0 0 1.5h7.19l-1.72 1.72a.75.75 0 0 0 0 1.06Z" /> {/* More standard next icon */}
     <path d="M5.25 5.25a.75.75 0 00-.75.75v12a.75.75 0 00.75.75H18a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75H5.25zM18.75 12a.75.75 0 000-1.5H15V8.684a.75.75 0 00-1.28-.53L9.97 11.22a.75.75 0 000 1.06l3.75 3.066A.75.75 0 0015 14.816V12.75h3.75z" /> {/* Skip icon */}
    <path d="M19.5 18a.75.75 0 0 0 .75-.75V6.75a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0 0 1.5h3V17.25h-3a.75.75 0 0 0 0 1.5h3ZM4.009 6.482a.75.75 0 0 0-.53 1.28l5.25 4.5a.75.75 0 0 0 0 1.06l-5.25 4.5a.75.75 0 0 0 .53 1.28H6a.75.75 0 0 0 .75-.75V7.232a.75.75 0 0 0-.75-.75H4.009Z" /> {/* This is the correct next track (skip next) icon */}
  </svg>
);
export default NextIcon;
