'use client';

/**
 * LocationSearch Component - Ember Noir Design System
 *
 * Reusable location search component with:
 * - Debounced autocomplete (300ms delay, min 3 chars)
 * - Geolocation button ("Usa la mia posizione")
 * - Collapsible manual coordinate entry
 * - Error display with Italian messages
 */

import { useState, useEffect } from 'react';
import { useDebounce } from '@/app/hooks/useDebounce';
import { getCurrentLocation } from '@/lib/geolocation';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import Banner from '@/app/components/ui/Banner';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import Card from '@/app/components/ui/Card';
import { Text } from '@/app/components/ui';
import { cn } from '@/lib/utils/cn';

interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
}

interface Suggestion {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchProps {
  onLocationSelected: (location: LocationData) => void;
  currentLocation?: LocationData | null;
  className?: string;
}

export default function LocationSearch({
  onLocationSelected,
  currentLocation,
  className,
}: LocationSearchProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);

  // Manual coordinates state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/geocoding/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        );
        const data = await response.json();

        if (data.success) {
          setSuggestions(data.results || []);
          if (data.results.length === 0) {
            setError('Nessun risultato. Prova con un nome più completo o una città vicina.');
          }
        } else {
          // Handle API error response
          setError(data.error || 'Errore durante la ricerca');
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Errore durante la ricerca. Riprova.');
        }
      } finally {
        setIsSearching(false);
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [debouncedQuery]);

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    const locationName = suggestion.admin1
      ? `${suggestion.name}, ${suggestion.admin1}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`;

    onLocationSelected({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      name: locationName,
    });
    setSearchQuery('');
    setSuggestions([]);
    setError(null);
  };

  // Handle "Usa la mia posizione"
  const handleUseMyLocation = async () => {
    setIsLocating(true);
    setError(null);

    try {
      const { latitude, longitude } = await getCurrentLocation();

      // Reverse geocode to get city name
      const response = await fetch(
        `/api/geocoding/reverse?lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      if (data.success) {
        onLocationSelected({
          latitude,
          longitude,
          name: data.name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      } else {
        // Use coordinates as fallback name
        onLocationSelected({
          latitude,
          longitude,
          name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la geolocalizzazione');
    } finally {
      setIsLocating(false);
    }
  };

  // Handle manual coordinate submission
  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitudine non valida (deve essere tra -90 e 90)');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitudine non valida (deve essere tra -180 e 180)');
      return;
    }

    onLocationSelected({
      latitude: lat,
      longitude: lon,
      name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    });
    setShowAdvanced(false);
    setManualLat('');
    setManualLon('');
    setError(null);
  };

  return (
    <div className={className}>
      {/* Current location display */}
      {currentLocation && (
        <div className={cn(
          'mb-4 rounded-lg border p-3',
          'border-sage-700/30 bg-sage-900/20',
          ' '
        )}>
          <Text variant="tertiary" size="xs" className="mb-1">
            Posizione attuale
          </Text>
          <Text>{currentLocation.name}</Text>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Input
          label="Cerca città"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Es. Milano, Roma, Napoli..."
        />

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul className={cn(
            'absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border-[0.5px] shadow-lg',
            'border-white/8 bg-[rgba(28,25,23,0.96)] backdrop-blur-xl',
          )}>
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    'hover:bg-white/6',
                  )}
                >
                  <MapPin size={16} className="shrink-0 text-ocean-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <Text className="truncate">{s.name}</Text>
                    <Text variant="tertiary" size="sm" className="truncate">
                      {s.country}{s.admin1 ? `, ${s.admin1}` : ''}
                    </Text>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Search loading indicator */}
      {isSearching && (
        <Text variant="tertiary" size="sm" className="mt-2">
          Ricerca in corso...
        </Text>
      )}

      {/* Geolocation button */}
      <div className="mt-4">
        <Button
          variant="subtle"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          loading={isLocating}
          icon={<MapPin size={16} />}
          className="w-full sm:w-auto"
        >
          Usa la mia posizione
        </Button>
      </div>

      {/* Advanced section toggle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
        icon={showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        className="mt-4"
      >
        Avanzate
      </Button>

      {/* Manual coordinates section */}
      {showAdvanced && (
        <Card variant="subtle" className="mt-3 space-y-3">
          <Text variant="secondary" size="sm">
            Inserisci coordinate manualmente
          </Text>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitudine"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="45.4642"
              type="number"
            />
            <Input
              label="Longitudine"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              placeholder="9.1900"
              type="number"
            />
          </div>
          <Button variant="subtle" size="sm" onClick={handleManualSubmit}>
            Usa coordinate
          </Button>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <Banner variant="error" compact className="mt-4">
          {error}
        </Banner>
      )}
    </div>
  );
}
