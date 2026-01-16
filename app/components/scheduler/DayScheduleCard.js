'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import TimeBar from './TimeBar';
import ScheduleInterval from './ScheduleInterval';

export default function DayScheduleCard({
  day,
  intervals,
  onAddInterval,
  onRemoveInterval,
  onChangeInterval,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleIntervalClick = (index) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <Heading level={2} size="xl">{day}</Heading>
            <Text variant="tertiary" size="sm">
              {intervals.length} {intervals.length === 1 ? 'intervallo' : 'intervalli'}
            </Text>
          </div>
        </div>
      </div>

      <TimeBar
        intervals={intervals}
        hoveredIndex={hoveredIndex}
        selectedIndex={selectedIndex}
        onHover={setHoveredIndex}
        onClick={handleIntervalClick}
      />

      <div className="space-y-3">
        {intervals.map((range, index) => (
          <ScheduleInterval
            key={index}
            range={range}
            isHighlighted={index === hoveredIndex || index === selectedIndex}
            onRemove={() => onRemoveInterval(index)}
            onChange={(field, value, isBlur) => onChangeInterval(index, field, value, isBlur)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleIntervalClick(index)}
          />
        ))}
      </div>

      <Button
        variant="success"
        icon="+"
        onClick={onAddInterval}
        className="mt-4 w-full"
      >
        Aggiungi intervallo
      </Button>
    </Card>
  );
}