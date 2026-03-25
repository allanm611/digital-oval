import { useEffect } from 'react';
import { useHistory } from '@docusaurus/router';

export default function Home(): JSX.Element {
  const history = useHistory();

  useEffect(() => {
    // Redirect to /docs/intro
    history.push('/docs/intro');
  }, [history]);

  return null;
}
