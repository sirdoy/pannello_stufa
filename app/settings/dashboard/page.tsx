'use client';

/**
 * Dashboard Settings Page
 *
 * Customize home page card order and visibility.
 * Per-user preferences stored in Firebase RTDB.
 *
 * Features:
 * - Reorder cards with up/down buttons
 * - Toggle card visibility
 * - Manual save with feedback
 */

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Switch from '@/app/components/ui/Switch';
import { Text, Badge, Banner } from '@/app/components/ui';
import Skeleton from '@/app/components/ui/Skeleton';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DashboardCard {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

interface SaveMessage {
  type: 'success' | 'error';
  text: string;
}

export default function DashboardSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);

  // Fetch current preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/config/dashboard');
        if (response.ok) {
          const data = await response.json();
          setCards(data.preferences.cardOrder || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPreferences();
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  // Move card up in the list
  const moveUp = (index: number) => {
    if (index === 0) return;
    setCards((prev) => {
      const newCards = [...prev];
      const current = newCards[index];
      const previous = newCards[index - 1];
      if (!current || !previous) return prev;
      [newCards[index - 1], newCards[index]] = [current, previous];
      return newCards;
    });
  };

  // Move card down in the list
  const moveDown = (index: number) => {
    if (index === cards.length - 1) return;
    setCards((prev) => {
      const newCards = [...prev];
      const current = newCards[index];
      const next = newCards[index + 1];
      if (!current || !next) return prev;
      [newCards[index], newCards[index + 1]] = [next, current];
      return newCards;
    });
  };

  // Toggle card visibility
  const toggleVisibility = (index: number, newVisible: boolean) => {
    setCards((prev) =>
      prev.map((card, i) =>
        i === index ? { ...card, visible: newVisible } : card
      )
    );
  };

  // Save preferences to server
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/config/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardOrder: cards }),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Preferenze salvate!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const data = await response.json();
        setSaveMessage({
          type: 'error',
          text: data.error || 'Errore durante il salvataggio',
        });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Errore di connessione' });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (userLoading || isLoading) {
    return (
      <SettingsLayout title="Personalizza home" icon="🏠">
        <Skeleton className="h-64 w-full" />
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Personalizza home" icon="🏠">
        <Card variant="glass">
          <Text variant="secondary">
            Devi essere autenticato per personalizzare la home.
          </Text>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Personalizza home" icon="🏠">
      {/* Card list */}
      <div className="space-y-3">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            variant="glass"
            padding={false}
            className={`p-4 ${card.visible ? '' : 'opacity-60'}`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Icon + Label + Badge */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{card.icon}</span>
                <div className="flex items-center gap-2">
                  <Text className="font-medium">{card.label}</Text>
                  {!card.visible && (
                    <Badge variant="neutral" size="sm">
                      Nascosto
                    </Badge>
                  )}
                </div>
              </div>

              {/* Right: Switch + Up/Down buttons */}
              <div className="flex items-center gap-4">
                <Switch
                  checked={card.visible}
                  onCheckedChange={(checked) => toggleVisibility(index, checked)}
                  variant="ember"
                  size="sm"
                  label={`Mostra ${card.label}`}
                />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    aria-label={`Sposta ${card.label} su`}
                  >
                    <ChevronUp size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    disabled={index === cards.length - 1}
                    onClick={() => moveDown(index)}
                    aria-label={`Sposta ${card.label} giù`}
                  >
                    <ChevronDown size={20} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Save section */}
      <div className="flex justify-end mt-6">
        <Button
          variant="ember"
          onClick={handleSave}
          loading={isSaving}
          disabled={isSaving}
        >
          Salva
        </Button>
      </div>

      {/* Save feedback */}
      {saveMessage && (
        <Banner
          variant={saveMessage.type === 'success' ? 'success' : 'error'}
          compact
          className="mt-4"
        >
          {saveMessage.text}
        </Banner>
      )}
    </SettingsLayout>
  );
}
