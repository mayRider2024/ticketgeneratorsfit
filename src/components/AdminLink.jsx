'use client';

import Link from 'next/link';

export default function AdminLink() {
  return (
    <Link 
      href="/admin-login"
      className="text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
    >
      mayuresh
    </Link>
  );
}