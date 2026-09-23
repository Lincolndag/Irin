import heroFallback from '../../assets/hero.png';
import { resolveBackendImageUrl } from '../../utils/api';

export default function ImageWithFallback({
  src,
  fallback = heroFallback,
  alt = '',
  onError,
  ...props
}) {
  return (
    <img
      {...props}
      src={resolveBackendImageUrl(src, fallback)}
      alt={alt}
      onError={(event) => {
        event.currentTarget.src = fallback;
        if (onError) onError(event);
      }}
    />
  );
}
