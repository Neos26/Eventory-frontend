import { useParams } from 'react-router-dom';
import PagePlaceholder from '../components/PagePlaceholder';

// The four :id routes share the same shell but read the route parameter,
// so titles prove the param is wired correctly.
export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <PagePlaceholder
      title={`Event #${id}`}
      description="Details for a single event, including dates, venue and status."
      route="/events/:id"
    />
  );
}
