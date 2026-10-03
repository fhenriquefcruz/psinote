import { useParams } from 'react-router-dom';
import DocumentGenerator from '../../components/documents/DocumentGenerator';

export default function DocumentGeneratorPage() {
  const { patientId } = useParams();

  return (
    <main className="page-shell">
      <DocumentGenerator patientId={patientId} />
    </main>
  );
}
