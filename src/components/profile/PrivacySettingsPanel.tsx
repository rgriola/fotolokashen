'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Users, Lock, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  showInSearch: boolean;
  showLocation: boolean;
  showSavedLocations: 'public' | 'followers' | 'private';
  allowFollowRequests: boolean;
}

export default function PrivacySettingsPanel() {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showInSearch: true,
    showLocation: true,
    showSavedLocations: 'public',
    allowFollowRequests: true,
  });
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showInSearch: true,
    showLocation: true,
    showSavedLocations: 'public',
    allowFollowRequests: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/v1/users/me');
      if (response.ok) {
        const data = await response.json();
        const fetchedSettings = {
          profileVisibility: data.user.profileVisibility || 'public',
          showInSearch: data.user.showInSearch ?? true,
          showLocation: data.user.showLocation ?? true,
          showSavedLocations: data.user.showSavedLocations || 'public',
          allowFollowRequests: data.user.allowFollowRequests ?? true,
        };
        setSettings(fetchedSettings);
        setOriginalSettings(fetchedSettings);
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Track changes
  useEffect(() => {
    const changedFields: string[] = [];

    if (settings.profileVisibility !== originalSettings.profileVisibility) {
      changedFields.push(`Profile Visibility: ${settings.profileVisibility}`);
    }
    if (settings.showInSearch !== originalSettings.showInSearch) {
      changedFields.push(`Show in Search: ${settings.showInSearch ? 'Yes' : 'No'}`);
    }
    if (settings.showLocation !== originalSettings.showLocation) {
      changedFields.push(`Show Location: ${settings.showLocation ? 'Yes' : 'No'}`);
    }
    if (settings.showSavedLocations !== originalSettings.showSavedLocations) {
      changedFields.push(`Saved Locations: ${settings.showSavedLocations}`);
    }
    if (settings.allowFollowRequests !== originalSettings.allowFollowRequests) {
      changedFields.push(`Allow Follow Requests: ${settings.allowFollowRequests ? 'Yes' : 'No'}`);
    }

    setChanges(changedFields);
    setHasChanges(changedFields.length > 0);
  }, [
    settings.profileVisibility,
    settings.showInSearch,
    settings.showLocation,
    settings.showSavedLocations,
    settings.allowFollowRequests,
    originalSettings.profileVisibility,
    originalSettings.showInSearch,
    originalSettings.showLocation,
    originalSettings.showSavedLocations,
    originalSettings.allowFollowRequests,
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Privacy settings updated');
        setOriginalSettings(settings);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(originalSettings);
    toast.info('Changes discarded');
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'followers':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Anyone can view';
      case 'followers':
        return 'Only followers can view';
      case 'private':
        return 'Only you can view';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Who can view your profile</Label>
            <Select
              value={settings.profileVisibility}
              onValueChange={(value: 'public' | 'followers' | 'private') =>
                setSettings({ ...settings, profileVisibility: value })
              }
            >
              <SelectTrigger id="profileVisibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">Anyone can view</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Followers Only</div>
                      <div className="text-xs text-muted-foreground">Only your followers</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">Only you can view</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getVisibilityDescription(settings.profileVisibility)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showInSearch">Show in search results</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to find you when searching
              </p>
            </div>
            <Switch
              id="showInSearch"
              checked={settings.showInSearch}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showInSearch: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowFollowRequests">Allow follow requests</Label>
              <p className="text-sm text-muted-foreground">
                Let others send you follow requests
              </p>
            </div>
            <Switch
              id="allowFollowRequests"
              checked={settings.allowFollowRequests}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allowFollowRequests: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Location Privacy
          </CardTitle>
          <CardDescription>
            Control visibility of your location information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showLocation">Show location on profile</Label>
              <p className="text-sm text-muted-foreground">
                Display city and country on your public profile
              </p>
            </div>
            <Switch
              id="showLocation"
              checked={settings.showLocation}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showLocation: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="showSavedLocations">Saved locations visibility</Label>
            <Select
              value={settings.showSavedLocations}
              onValueChange={(value: 'public' | 'followers' | 'private') =>
                setSettings({ ...settings, showSavedLocations: value })
              }
            >
              <SelectTrigger id="showSavedLocations">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">
                        Anyone can see your saved locations
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Followers Only</div>
                      <div className="text-xs text-muted-foreground">
                        Only followers can see
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">Only you can see</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Control who can view locations you&apos;ve saved on the map
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Privacy Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile visibility:</span>
              <Badge variant="outline" className="gap-1">
                {getVisibilityIcon(settings.profileVisibility)}
                {settings.profileVisibility}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Searchable:</span>
              <Badge variant={settings.showInSearch ? 'default' : 'secondary'}>
                {settings.showInSearch ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Location visible:</span>
              <Badge variant={settings.showLocation ? 'default' : 'secondary'}>
                {settings.showLocation ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Saved locations:</span>
              <Badge variant="outline" className="gap-1">
                {getVisibilityIcon(settings.showSavedLocations)}
                {settings.showSavedLocations}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-50 dark:bg-amber-950/20 border-t-2 border-amber-500 p-3 sm:p-4 shadow-lg z-50 animate-in slide-in-from-bottom">
          <div className="container max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                  <p className="font-semibold text-sm sm:text-base text-amber-900 dark:text-amber-100">
                    Unsaved privacy changes
                  </p>
                </div>
                <ul className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 space-y-1 ml-6 sm:ml-0">
                  {changes.slice(0, 3).map((change, i) => (
                    <li key={i} className="truncate">• {change}</li>
                  ))}
                  {changes.length > 3 && (
                    <li className="text-amber-700 dark:text-amber-300">
                      +{changes.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
              <div className="flex gap-2 sm:gap-2 sm:flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial border-amber-300 dark:border-amber-700 text-xs sm:text-sm h-9"
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm h-9"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
