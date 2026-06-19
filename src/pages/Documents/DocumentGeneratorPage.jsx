// src/pages/Documents/DocumentGeneratorPage.jsx
import { useParams } from 'react-router-dom';
import DocumentGenerator from '../../components/documents/DocumentGenerator';

export default function DocumentGeneratorPage() {
  const { patientId } = useParams();

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <DocumentGenerator 
        patientId={patientId} 
        onClose={() => window.history.back()} 
      />
    </div>
  );
}
