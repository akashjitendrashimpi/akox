'use client';

import { useState } from 'react';
import { ClaimForm } from './ClaimForm';

export function FinalClaim() {
  const [name, setName] = useState('');
  return <ClaimForm idPrefix="final" value={name} onChange={setName} placeholder="yourname" />;
}
