// src/pages/Documents/DocumentGeneratorPage.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import DocumentGenerator from '../../components/documents/DocumentGenerator';

export default function DocumentGeneratorPage() {
  const { patientId } = useParams();
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div style={{ padding: '1.5rem' }}>
      <DocumentGenerator 
        patientId={patientId} 
        onClose={() => setOpen(false)} 
      />
    </div>
  );
}
