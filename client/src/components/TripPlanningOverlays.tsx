import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTripPlanning } from '@/contexts/TripPlanningContext';

interface WhereOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhereOverlay({ isOpen, onClose }: WhereOverlayProps) {
  const { tripData, updateTripData, saveTripPlan, isSaving } = useTripPlanning();
  const [location, setLocation] = useState(tripData.location);
  const [isRoadTrip, setIsRoadTrip] = useState(tripData.isRoadTrip);

  useEffect(() => {
    if (isOpen) {
      setLocation(tripData.location);
      setIsRoadTrip(tripData.isRoadTrip);
    }
  }, [isOpen, tripData.location, tripData.isRoadTrip]);

  const handleSave = async () => {
    updateTripData({ location, isRoadTrip });
    await saveTripPlan();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Where</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Road trip?</span>
                <Switch
                  checked={isRoadTrip}
                  onCheckedChange={setIsRoadTrip}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gray-400 hover:bg-gray-500 text-white"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface WhenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhenOverlay({ isOpen, onClose }: WhenOverlayProps) {
  const { tripData, updateTripData, saveTripPlan, isSaving } = useTripPlanning();
  const [activeTab, setActiveTab] = useState<'dates' | 'flexible'>('dates');
  const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({
    start: tripData.startDate,
    end: tripData.endDate
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedDates({
        start: tripData.startDate,
        end: tripData.endDate
      });
    }
  }, [isOpen, tripData.startDate, tripData.endDate]);

  const handleUpdate = async () => {
    const duration = selectedDates.start && selectedDates.end 
      ? Math.ceil((selectedDates.end.getTime() - selectedDates.start.getTime()) / (1000 * 60 * 60 * 24))
      : tripData.duration;
    
    updateTripData({
      startDate: selectedDates.start,
      endDate: selectedDates.end,
      duration
    });
    await saveTripPlan();
    onClose();
  };

  const renderCalendar = () => {
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    const renderMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDay = new Date(year, month, day);
        const isSelected = selectedDates.start?.toDateString() === currentDay.toDateString() ||
                          selectedDates.end?.toDateString() === currentDay.toDateString();
        
        days.push(
          <button
            key={day}
            onClick={() => handleDateClick(currentDay)}
            className={`w-8 h-8 text-sm rounded hover:bg-gray-100 ${
              isSelected ? 'bg-black text-white' : 'text-gray-700'
            }`}
          >
            {day}
          </button>
        );
      }
      
      return (
        <div className="flex-1">
          <h3 className="font-semibold text-center mb-4">{monthName}</h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>
      );
    };

    const handleDateClick = (date: Date) => {
      if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
        setSelectedDates({ start: date, end: null });
      } else {
        if (date > selectedDates.start) {
          setSelectedDates({ ...selectedDates, end: date });
        } else {
          setSelectedDates({ start: date, end: null });
        }
      }
    };

    return (
      <div className="flex gap-8">
        {renderMonth(currentDate)}
        {renderMonth(nextMonth)}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">When</h2>
                <p className="text-sm text-gray-600">5 days</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-4 mb-6">
              <Button
                variant={activeTab === 'dates' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('dates')}
                className="rounded-full"
              >
                Dates
              </Button>
              <Button
                variant={activeTab === 'flexible' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('flexible')}
                className="rounded-full"
              >
                Flexible
              </Button>
            </div>

            {activeTab === 'dates' && (
              <div className="mb-6">
                {renderCalendar()}
              </div>
            )}

            {activeTab === 'flexible' && (
              <div className="mb-6 text-center text-gray-500">
                <p>Flexible date options coming soon...</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleUpdate}
                disabled={isSaving}
                className="bg-black text-white hover:bg-gray-800 px-8"
              >
                {isSaving ? 'Saving...' : 'Update'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface TravelersOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TravelersOverlay({ isOpen, onClose }: TravelersOverlayProps) {
  const { tripData, updateTripData, saveTripPlan, isSaving } = useTripPlanning();
  const [count, setCount] = useState(tripData.travelers);

  useEffect(() => {
    if (isOpen) {
      setCount(tripData.travelers);
    }
  }, [isOpen, tripData.travelers]);

  const handleUpdate = async () => {
    updateTripData({ travelers: count });
    await saveTripPlan();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Travelers</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Number of travelers</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCount(Math.max(1, count - 1))}
                    disabled={count <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{count}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCount(count + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleUpdate}
                disabled={isSaving}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                {isSaving ? 'Saving...' : 'Update'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BudgetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BudgetOverlay({ isOpen, onClose }: BudgetOverlayProps) {
  const { t, i18n } = useTranslation();
  const { tripData, updateTripData, saveTripPlan, isSaving } = useTripPlanning();
  const [selectedBudget, setSelectedBudget] = useState(tripData.budget);

  useEffect(() => {
    if (isOpen) {
      setSelectedBudget(tripData.budget);
    }
  }, [isOpen, tripData.budget]);

  // Use € for European languages (German, French, Spanish), $ for others
  const currencySymbol = ['de', 'fr', 'es'].includes(i18n.language) ? '€' : '$';

  const budgetOptions = [
    { value: 'Any budget', label: t('budgetOptions.any') },
    { value: 'On a budget', label: t('budgetOptions.budget'), symbol: currencySymbol },
    { value: 'Sensibly priced', label: t('budgetOptions.sensible'), symbol: currencySymbol.repeat(2) },
    { value: 'Upscale', label: t('budgetOptions.upscale'), symbol: currencySymbol.repeat(3) },
    { value: 'Luxury', label: t('budgetOptions.luxury'), symbol: currencySymbol.repeat(4) }
  ];

  const handleUpdate = async () => {
    updateTripData({ budget: selectedBudget });
    await saveTripPlan();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">{t('budget')}</h2>
                <p className="text-sm text-gray-600">Select your budget range</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 mb-6">
              {budgetOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="budget"
                    value={option.value}
                    checked={selectedBudget === option.value}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    {option.symbol && (
                      <span className="font-semibold text-gray-700">{option.symbol}</span>
                    )}
                    <span>{option.label}</span>
                  </div>
                </label>
              ))}
            </div>

            <Button
              onClick={handleUpdate}
              disabled={isSaving}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              {isSaving ? 'Saving...' : t('update')}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}