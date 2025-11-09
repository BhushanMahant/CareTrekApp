import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  Share,
  Linking,
  SafeAreaView as RNFSafeAreaView,
  PermissionsAndroid,
  NativeModules
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, Region, MapType, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../contexts/translation/TranslationContext';
import { useCachedTranslation } from '../../hooks/useCachedTranslation';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

type LocationPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

type SafeZone = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  radius: number;
};

const STORAGE_KEYS = {
  FAVORITES: '@map_favorites_v1',
  SAFE_ZONES: '@map_safezones_v1',
  HISTORY: '@map_history_v1',
  HOME: '@map_home_v1',
};

const DEFAULT_REGION: Region = {
  latitude: 21.005066,
  longitude: 79.047718,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const { isDark } = useTheme();
  const { currentLanguage } = useTranslation();

  const { translatedText: myLocationText } = useCachedTranslation('My Location', currentLanguage);
  const { translatedText: shareText } = useCachedTranslation('Share', currentLanguage);
  const { translatedText: backText } = useCachedTranslation('Back', currentLanguage);
  const { translatedText: sosText } = useCachedTranslation('SOS', currentLanguage);

  const mapRef = useRef<MapView | null>(null);

  // Map & UI
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);

  // Sharing (simplified: one-shot share)
  const [isSharingLive, setIsSharingLive] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Location + history
  const [currentLocation, setCurrentLocation] = useState<LocationPoint>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
    timestamp: Date.now(),
  });
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
  const [historyPlaybackIndex, setHistoryPlaybackIndex] = useState<number>(0);
  const [isPlayingHistory, setIsPlayingHistory] = useState(false);

  // history UI
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Safezones, favorites, home
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [tempZoneCoords, setTempZoneCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [newZoneModalVisible, setNewZoneModalVisible] = useState(false);
  const [newZoneTitle, setNewZoneTitle] = useState('');
  const [newZoneRadius, setNewZoneRadius] = useState<number>(100);
  const [favorites, setFavorites] = useState<LocationPoint[]>([]);
  const [favoritesModalVisible, setFavoritesModalVisible] = useState(false);
  const [homeLocation, setHomeLocation] = useState<LocationPoint | null>(null);
  const [homeAddress, setHomeAddress] = useState<string>('');

  // Search
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Turn-by-turn (in-app)
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeSteps, setRouteSteps] = useState<Array<{ instruction: string; lat: number; lng: number }>>([]);
  const navAnimRef = useRef<number | null>(null);
  const navIndexRef = useRef<number>(0);

  // Request location permission for both Android and iOS
  const requestLocationPermission = async () => {
    try {
      console.log('Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status === 'granted') {
        console.log('Location permission granted');
        // Check if location is enabled
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          console.log('Location services are disabled');
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services on your device to use this feature.',
            [
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings()
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return false;
        }
        return true;
      } else {
        console.log('Location permission denied');
        Alert.alert(
          'Permission Required',
          'Location permission is needed to show your position on the map. Please enable it in your device settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return false;
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
      Alert.alert('Error', 'Failed to request location permission. Please try again.');
      return false;
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    console.log('Getting current location...');

    try {
      // First check if we have permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted, requesting...');
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return null;
      }

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services on your device to use this feature.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return null;
      }

      console.log('Requesting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5,
        mayShowUserSettingsDialog: true, // Show dialog to enable location if disabled
      });

      console.log('Got position:', location);
      const { latitude, longitude, accuracy } = location.coords;
      
      if (!latitude || !longitude) {
        throw new Error('Invalid coordinates received');
      }

      // Only update if we have valid coordinates
      if (latitude && longitude) {
        const newLocation = {
          latitude,
          longitude,
          timestamp: Date.now(),
        };

        console.log('New location:', newLocation);
        setCurrentLocation(newLocation);
        setLocationHistory((prev) => [...prev.slice(-199), newLocation]);
        checkSafeZones(newLocation);

        // Center map on current location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 350);
        }

        return newLocation;
      }
    } catch (error: any) {
      console.warn('Error getting location:', error);
      let errorMessage = 'Unable to get your current location.';

      if (error?.code === 'E_LOCATION_UNAUTHORIZED') {
        errorMessage = 'Location permission was denied. Please enable it in app settings.';
      } else if (error?.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location information is unavailable. Please check your device settings.';
      } else if (error?.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out. Please try again.';
      }

      Alert.alert('Location Error', errorMessage, [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
        { text: 'OK' }
      ]);
    }
    return null;
  };

  // Watch position for updates
  const watchPosition = () => {
    let subscription: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // Update every 10 meters
        timeInterval: 5000,   // Update every 5 seconds
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const newLocation = {
          latitude,
          longitude,
          timestamp: Date.now(),
        };
        setCurrentLocation(newLocation);
        setLocationHistory((prev) => [...prev.slice(-199), newLocation]);
        checkSafeZones(newLocation);
      }
    ).then(sub => {
      subscription = sub;
    }).catch(error => {
      console.warn('Error watching location:', error);
    });

    // Return cleanup function
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  };

  // Initialize location services
  const initLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        // Get initial location
        await getCurrentLocation();

        // Start watching position for updates
        const cleanupWatch = watchPosition();

        // Return cleanup function
        return () => {
          if (cleanupWatch) {
            cleanupWatch();
          }
        };
      }
    } catch (error) {
      console.warn('Error initializing location:', error);
      Alert.alert('Location Error', 'Failed to initialize location services');
    }
  };

  // ---------- lifecycle ----------
  useEffect(() => {
    (async () => {
      await loadPersistedData();
      await initLocation();
    })();

    return () => {
      stopNavAnimation();
    };
  }, []);

  // persist favorites/safezones/history/home when changed
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites)).catch(() => {}); }, [favorites]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.SAFE_ZONES, JSON.stringify(safeZones)).catch(() => {}); }, [safeZones]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(locationHistory)).catch(() => {}); }, [locationHistory]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.HOME, JSON.stringify(homeLocation)).catch(() => {}); }, [homeLocation]);

  // update address when currentLocation changes
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const addr = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
        if (mounted) setCurrentAddress(addr);
      } catch (e) {
        console.warn('Reverse geocode failed', e);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [currentLocation]);

  // ---------- helpers ----------
  const loadPersistedData = async () => {
    try {
      const favRaw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      const szRaw = await AsyncStorage.getItem(STORAGE_KEYS.SAFE_ZONES);
      const histRaw = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      const homeRaw = await AsyncStorage.getItem(STORAGE_KEYS.HOME);
      if (favRaw) setFavorites(JSON.parse(favRaw));
      if (szRaw) setSafeZones(JSON.parse(szRaw));
      if (histRaw) setLocationHistory(JSON.parse(histRaw));
      if (homeRaw) {
        const h = JSON.parse(homeRaw);
        setHomeLocation(h);
        if (h) reverseGeocode(h.latitude, h.longitude).then(a => setHomeAddress(a)).catch(() => {});
      }
    } catch (e) {
      console.warn('Load persisted failed', e);
    }

    // if no history, seed demo
    if (!locationHistory || locationHistory.length === 0) {
      const demoHistory: LocationPoint[] = [
        { latitude: 37.78825, longitude: -122.4324, timestamp: Date.now() - 1800_000 },
        { latitude: 37.78925, longitude: -122.4334, timestamp: Date.now() - 1200_000 },
        { latitude: 37.79025, longitude: -122.4344, timestamp: Date.now() - 600_000 },
        { latitude: 37.79125, longitude: -122.4354, timestamp: Date.now() },
      ];
      setLocationHistory(demoHistory);
    }
  };

  // Refresh location button handler
  const handleRefreshLocation = () => {
    getCurrentLocation();
  };

  const checkSafeZones = (loc: LocationPoint) => {
    safeZones.forEach((z) => {
      const distance = haversineDistance(z.latitude, z.longitude, loc.latitude, loc.longitude);
      if (distance <= z.radius) console.log(`[zone] inside ${z.title}`);
    });
  };

  const confirmAddSafeZone = () => {
    if (!tempZoneCoords) {
      Alert.alert('Error', 'No coordinates selected.');
      return;
    }
    const newZone: SafeZone = {
      id: `zone_${Date.now()}`,
      title: newZoneTitle || 'Safe Zone',
      latitude: tempZoneCoords.latitude,
      longitude: tempZoneCoords.longitude,
      radius: newZoneRadius,
    };
    setSafeZones((s) => [...s, newZone]);
    setNewZoneModalVisible(false);
    setTempZoneCoords(null);
    setNewZoneTitle('');
    setNewZoneRadius(100);
    Alert.alert('Zone added', newZone.title);
  };

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ---------- Reverse geocoding (Nominatim) - improved for long precise address ----------
  const buildLongAddressFromNominatim = (addrObj: any) => {
    if (!addrObj) return '';
    const parts: string[] = [];

    const pushIf = (v?: string | null) => { if (v && v.trim()) parts.push(v.trim()); };

    // Common fields in priority order
    pushIf(addrObj.house_number);
    pushIf(addrObj.road || addrObj.pedestrian || addrObj.cycleway);
    pushIf(addrObj.neighbourhood || addrObj.suburb || addrObj.village || addrObj.hamlet);
    pushIf(addrObj.city_district);
    pushIf(addrObj.city || addrObj.town || addrObj.village);
    pushIf(addrObj.county);
    pushIf(addrObj.state_district);
    pushIf(addrObj.state);
    pushIf(addrObj.postcode);
    pushIf(addrObj.country);

    return parts.join(', ');
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      // request addressdetails=1 and namedetails to get full components
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'CareTrek/1.0 (contact: none)' } });
      if (!res.ok) throw new Error('geocode failed');
      const json = await res.json();

      // Build the most precise long address possible
      const longAddress = buildLongAddressFromNominatim(json.address) || json.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

      // Append extra context like place type or notable name if available
      const named = json.name || json.display_name || '';
      const placeType = json.type ? `(${json.type})` : '';

      // Final address: longAddress + named/placeType
      const final = [longAddress, named, placeType].filter(Boolean).join(' ').trim();

      return final || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch (e) {
      console.warn('Reverse geocode error', e);
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  // ---------- Share (improved to include cross-platform links & full address) ----------
  const openShareModal = () => setShareModalVisible(true);
  const closeShareModal = () => setShareModalVisible(false);

  const makeCrossPlatformLocationLinks = (lat: number, lon: number) => {
    const latStr = lat.toFixed(6);
    const lonStr = lon.toFixed(6);
    const google = `https://www.google.com/maps/search/?api=1&query=${latStr},${lonStr}`;
    const apple = `http://maps.apple.com/?q=${latStr},${lonStr}`;
    const osm = `https://www.openstreetmap.org/?mlat=${latStr}&mlon=${lonStr}#map=19/${latStr}/${lonStr}`;
    const geoUri = `geo:${latStr},${lonStr}`; // works on many android devices
    return { google, apple, osm, geoUri };
  };

  const startLiveShare = async () => {
    setIsSharingLive(true);
    setShareModalVisible(false);

    // get address for current location
    const addr = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
    const links = makeCrossPlatformLocationLinks(currentLocation.latitude, currentLocation.longitude);

    const locTextLines = [
      `Location address: ${addr}`,
      `Coordinates: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
      `Open in Google Maps: ${links.google}`,
      `Open in Apple Maps: ${links.apple}`,
      `Open in OSM: ${links.osm}`,
      `Intent (geo URI): ${links.geoUri}`,
    ];

    const message = `My precise location:\n\n${locTextLines.join('\n')}`;

    try {
      await Share.share({ message, title: 'My precise location' });
    } catch (e) {
      console.warn('Share failed', e);
      Alert.alert('Share', 'Unable to open share sheet.');
    }

    setIsSharingLive(false);
  };

  // ---------- Home (save current as home) ----------
  const saveHome = async () => {
    const p = currentLocation;
    setHomeLocation(p);
    const addr = await reverseGeocode(p.latitude, p.longitude);
    setHomeAddress(addr);
    Alert.alert('Home saved', addr);
  };

  const navigateHome = async () => {
    if (!homeLocation) { Alert.alert('Home', 'No home saved.'); return; }
    // use OSRM demo server for routing (open-source). If fails, fallback to straight line.
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${currentLocation.longitude},${currentLocation.latitude};${homeLocation.longitude},${homeLocation.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes && json.routes.length) {
        const coords = json.routes[0].geometry.coordinates.map((c: any) => ({ latitude: c[1], longitude: c[0] }));
        setRouteCoords(coords);
        // simple step extraction from legs (if available)
        const steps: Array<{ instruction: string; lat: number; lng: number }> = [];
        (json.routes[0].legs || []).forEach((leg: any) => { (leg.steps || []).forEach((s: any) => { steps.push({ instruction: s.maneuver && s.maneuver.instruction ? s.maneuver.instruction : 'Proceed', lat: s.maneuver.location[1], lng: s.maneuver.location[0] }); }); });
        setRouteSteps(steps);
        startRouteAnimation(coords, steps);
      } else {
        startStraightLineNav(homeLocation.latitude, homeLocation.longitude);
      }
    } catch (e) {
      console.warn('OSRM failed', e);
      startStraightLineNav(homeLocation.latitude, homeLocation.longitude);
    }
  };

  // ---------- SOS (improved with long address + links) ----------
  const triggerSOS = async () => {
    const addr = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
    const links = makeCrossPlatformLocationLinks(currentLocation.latitude, currentLocation.longitude);
    const locText = `${addr} (Google Maps: ${links.google})`;
    const message = `SOS! Please help. My location:\n\nAddress: ${addr}\nCoordinates: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}\nGoogle Maps: ${links.google}\nOSM: ${links.osm}`;

    try {
      await Share.share({ message, title: 'SOS — Help' });
    } catch (e) {
      console.warn('Share failed', e);
      Alert.alert('SOS', 'Unable to open sharing options — please call your emergency contacts.');
    }

    Alert.alert('SOS', 'SOS message prepared. Please complete the send in your messaging app.');
  };

  // ---------- Navigation helpers (straight line + route animation) ----------
  const startStraightLineNav = (destLat: number, destLng: number) => {
    const steps = generateStraightLineSteps(currentLocation.latitude, currentLocation.longitude, destLat, destLng, 30);
    const coords = steps.map(s => ({ latitude: s.lat, longitude: s.lon }));
    setRouteCoords(coords);
    const inst = coords.map((c, i) => ({ instruction: `Step ${i + 1}`, lat: c.latitude, lng: c.longitude }));
    setRouteSteps(inst);
    startRouteAnimation(coords, inst);
  };

  const generateStraightLineSteps = (lat1: number, lon1: number, lat2: number, lon2: number, segments = 10) => {
    const out: Array<{ lat: number; lon: number }> = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments; out.push({ lat: lat1 + (lat2 - lat1) * t, lon: lon1 + (lon2 - lon1) * t });
    }
    return out;
  };

  const startRouteAnimation = (coords: Array<{ latitude: number; longitude: number }>, steps: Array<{ instruction: string; lat: number; lng: number }>) => {
    stopNavAnimation();
    if (!coords || coords.length === 0) return;
    navIndexRef.current = 0;
    navAnimRef.current = setInterval(() => {
      const idx = navIndexRef.current;
      if (idx >= coords.length) { stopNavAnimation(); setRouteSteps([]); setRouteCoords([]); return; }
      const c = coords[idx];
      mapRef.current?.animateToRegion({ latitude: c.latitude, longitude: c.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
      navIndexRef.current = idx + 1;
    }, 700) as unknown as number;
  };

  const stopNavAnimation = () => { if (navAnimRef.current) { clearInterval(navAnimRef.current as any); navAnimRef.current = null; navIndexRef.current = 0; } };

  const startNavigationTo = async (lat: number, lng: number) => { // in-app route fetching (OSRM)
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${currentLocation.longitude},${currentLocation.latitude};${lng},${lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes && json.routes.length) {
        const coords = json.routes[0].geometry.coordinates.map((c: any) => ({ latitude: c[1], longitude: c[0] }));
        setRouteCoords(coords);
        const steps: Array<{ instruction: string; lat: number; lng: number }> = [];
        (json.routes[0].legs || []).forEach((leg: any) => { (leg.steps || []).forEach((s: any) => { steps.push({ instruction: s.maneuver && s.maneuver.instruction ? s.maneuver.instruction : 'Proceed', lat: s.maneuver.location[1], lng: s.maneuver.location[0] }); }); });
        setRouteSteps(steps);
        startRouteAnimation(coords, steps);
      } else {
        startStraightLineNav(lat, lng);
      }
    } catch (e) {
      console.warn('OSRM failed', e);
      startStraightLineNav(lat, lng);
    }
  };

  // ---------- history controls ----------
  const togglePlayPause = () => { setIsPlayingHistory((p) => { const next = !p; if (next && locationHistory.length > 0) setHistoryExpanded(true); return next; }); };
  const clearHistory = () => { Alert.alert('Confirm', 'Clear location history?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: () => { setLocationHistory([]); setHistoryPlaybackIndex(0); } }, ]); };

  // ---------- Search ----------
  const openSearch = () => setSearchModalVisible(true);
  const closeSearch = () => setSearchModalVisible(false);
  const performSearchAndCenter = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    const parts = q.split(',').map((s) => s.trim());
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      const lat = Number(parts[0]); const lng = Number(parts[1]); mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 350); closeSearch(); return;
    }
    Alert.alert('Search', 'Please enter coordinates as `lat,lng` or ask me to wire a geocoding provider.');
  };

  // ---------- Render ----------
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F1724' : '#FFFBEF' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#24303a' : '#E6E6E6' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={20} color={isDark ? '#E2E8F0' : '#1A202C'} />
          <Text style={[styles.headerTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>{myLocationText}</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setFavoritesModalVisible(true)} style={styles.iconButton} accessibilityLabel="Open favorites">
            <Ionicons name="star" size={20} color={isDark ? '#E2E8F0' : '#1A202C'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMapType((t) => (t === 'standard' ? 'satellite' : t === 'satellite' ? 'hybrid' : 'standard'))} style={styles.iconButton}>
            <Ionicons name="layers" size={20} color={isDark ? '#E2E8F0' : '#1A202C'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowTraffic((s) => !s)} style={styles.iconButton}>
            <Ionicons name="speedometer" size={20} color={showTraffic ? '#EF4444' : (isDark ? '#E2E8F0' : '#1A202C')} />
          </TouchableOpacity>

          <TouchableOpacity onPress={openShareModal} style={[styles.shareButton, { backgroundColor: isDark ? '#1F2937' : '#2F855A' }]}>
            <Ionicons name="share-social" size={18} color="white" />
            <Text style={styles.shareButtonText}>{shareText}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={(r) => (mapRef.current = r)}
          style={styles.map}
          initialRegion={DEFAULT_REGION}
          showsUserLocation
          showsMyLocationButton
          followsUserLocation
          onLongPress={(e) => { setTempZoneCoords(e.nativeEvent.coordinate); setNewZoneModalVisible(true); }}
          mapType={mapType}
          showsTraffic={showTraffic}
        >
          <Marker coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }} title="You" description={currentAddress || new Date(currentLocation.timestamp).toLocaleString()} />

          {homeLocation && (
            <Marker coordinate={{ latitude: homeLocation.latitude, longitude: homeLocation.longitude }} title="Home" description={homeAddress} pinColor="green">
            </Marker>
          )}

          {locationHistory.map((p, i) => (<Marker key={`hist-${i}`} coordinate={{ latitude: p.latitude, longitude: p.longitude }} opacity={0.5} />))}
          {safeZones.map((z) => (<Circle key={z.id} center={{ latitude: z.latitude, longitude: z.longitude }} radius={z.radius} strokeColor="rgba(34,139,34,0.6)" fillColor="rgba(34,139,34,0.15)" />))}
          {favorites.map((f, idx) => (<Marker key={`fav-${idx}`} coordinate={{ latitude: f.latitude, longitude: f.longitude }} pinColor="purple" />))}
          {tempZoneCoords && <Marker coordinate={tempZoneCoords} pinColor="orange" />}

          {/* route polyline */}
          {routeCoords && routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} lineDashPattern={[1]} />
          )}
        </MapView>
      </View>

      {/* Footer (bottom panel) - search icon added, favorites removed from footer */}
      <View style={[styles.footer, { backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={20} color={isDark ? '#63B3ED' : '#3182CE'} style={styles.locationIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.addressTitle, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>Current Location</Text>
            <Text style={[styles.address, { color: isDark ? '#9AA6B2' : '#4A5568' }]}>{currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</Text>
            <Text style={[styles.smallText, { color: isDark ? '#9AA6B2' : '#718096' }]} numberOfLines={2}>{currentAddress || 'Address: —'}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.footerButton} onPress={() => mapRef.current?.animateToRegion({ latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 350)}><Ionicons name="locate" size={20} color="white" /></TouchableOpacity>

          {/* Search button (new) */}
          <TouchableOpacity style={[styles.footerButton, { backgroundColor: '#2563EB' }]} onPress={() => setSearchModalVisible(true)}><Ionicons name="search" size={20} color="white" /></TouchableOpacity>

          <TouchableOpacity style={[styles.footerButton, { backgroundColor: '#2F855A' }]} onPress={saveHome}><Ionicons name="home" size={20} color="white" /></TouchableOpacity>
        </View>
      </View>

      {/* SOS Floating Button (right) */}
      <TouchableOpacity style={styles.sosButton} onPress={triggerSOS} activeOpacity={0.8}><Ionicons name="warning" size={28} color="white" /><Text style={styles.sosText}>{sosText ?? 'SOS'}</Text></TouchableOpacity>

      {/* Vertical history controls (right, above SOS) */}
      {!historyExpanded ? (
        <View style={[styles.verticalHistoryRight, { backgroundColor: isDark ? '#071127' : '#FFFFFF' }]}>
          <TouchableOpacity style={styles.iconSquare} onPress={togglePlayPause} accessibilityLabel="PlayPause history"><Ionicons name={isPlayingHistory ? 'pause' : 'play'} size={18} color="white" /></TouchableOpacity>
          <TouchableOpacity style={[styles.iconSquare, { marginTop: 8 }]} onPress={clearHistory} accessibilityLabel="Clear history"><Ionicons name="trash" size={16} color="white" /></TouchableOpacity>
          <TouchableOpacity style={[styles.iconSquare, { marginTop: 8 }]} onPress={() => setHistoryExpanded(true)} accessibilityLabel="Expand history"><Ionicons name="chevron-up" size={18} color="white" /></TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.historyPanelExpanded, { backgroundColor: isDark ? '#071127' : '#FFFFFF' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: isDark ? '#E2E8F0' : '#111', fontWeight: '600' }}>Location History</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.smallAction} onPress={() => setHistoryExpanded(false)}><Ionicons name="chevron-down" size={18} color={isDark ? '#E2E8F0' : '#111'} /></TouchableOpacity>
            </View>
          </View>

          <Slider style={{ width: Math.max(180, width - 220) }} minimumValue={0} maximumValue={Math.max(locationHistory.length - 1, 0)} step={1} value={Math.min(historyPlaybackIndex, Math.max(locationHistory.length - 1, 0))} minimumTrackTintColor="#2563EB" onValueChange={(v: number) => { const vi = Math.round(v); setHistoryPlaybackIndex(vi); const p = locationHistory[vi]; if (p) { mapRef.current?.animateToRegion({ latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300); } }} disabled={locationHistory.length === 0} />

          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}><Ionicons name={isPlayingHistory ? 'pause' : 'play'} size={18} color="white" /></TouchableOpacity>
            <TouchableOpacity style={[styles.playButton, { marginLeft: 8 }]} onPress={clearHistory}><Ionicons name="trash" size={18} color="white" /></TouchableOpacity>
          </View>
        </View>
      )}

      {/* Share Modal (simplified - one-shot share) */}
      <Modal visible={shareModalVisible} transparent animationType="slide" onRequestClose={closeShareModal}>
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: isDark ? '#0B1220' : '#FFF' }]}>
          <Text style={[styles.modalTitle, { color: isDark ? '#E2E8F0' : '#111' }]}>Share location</Text>

          <Text style={{ marginBottom: 12 }}>Share your current precise location (full address + coordinates + open links).</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.modalButtonCancel} onPress={closeShareModal}><Text>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonPrimary} onPress={startLiveShare}><Text style={{ color: 'white' }}>Share</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* Add Safe Zone Modal */}
      <Modal visible={newZoneModalVisible} transparent animationType="slide" onRequestClose={() => setNewZoneModalVisible(false)}>
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: isDark ? '#0B1220' : '#FFF' }]}>
          <Text style={[styles.modalTitle, { color: isDark ? '#E2E8F0' : '#111' }]}>Add Safe Zone</Text>

          <TextInput placeholder="Zone name" value={newZoneTitle} onChangeText={setNewZoneTitle} style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F7FAFC', color: isDark ? '#E2E8F0' : '#111' }]} placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'} />

          <Text style={{ marginBottom: 8 }}>{`Radius (meters): ${newZoneRadius}`}</Text>
          <Slider minimumValue={50} maximumValue={1000} step={10} value={newZoneRadius} onValueChange={(v) => setNewZoneRadius(Math.round(v))} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity style={styles.modalButtonCancel} onPress={() => { setNewZoneModalVisible(false); setTempZoneCoords(null); }}><Text>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonPrimary} onPress={confirmAddSafeZone}><Text style={{ color: 'white' }}>Add Zone</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* Favorites Modal (moved from footer) */}
      <Modal visible={favoritesModalVisible} transparent animationType="slide" onRequestClose={() => setFavoritesModalVisible(false)}>
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: isDark ? '#0B1220' : '#FFF', maxHeight: 400 }]}>
          <Text style={[styles.modalTitle, { color: isDark ? '#E2E8F0' : '#111' }]}>Favorites</Text>
          {favorites.length === 0 ? (<Text style={{ color: isDark ? '#9CA3AF' : '#4A5568' }}>No favorites saved.</Text>) : (favorites.map((f, i) => (
            <TouchableOpacity key={`fav-item-${i}`} style={{ padding: 10, borderRadius: 8, marginVertical: 6, backgroundColor: isDark ? '#071127' : '#F7FAFC' }} onPress={() => { setFavoritesModalVisible(false); mapRef.current?.animateToRegion({ latitude: f.latitude, longitude: f.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 350); }}>
              <Text style={{ color: isDark ? '#E2E8F0' : '#111' }}>{`${f.latitude.toFixed(5)}, ${f.longitude.toFixed(5)}`}</Text>
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <TouchableOpacity style={{ marginRight: 12 }} onPress={() => startNavigationTo(f.latitude, f.longitude)}><Text style={{ color: '#2563EB' }}>Navigate</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setFavorites((prev) => prev.filter((_, idx) => idx !== i)); }}><Text style={{ color: '#EF4444' }}>Remove</Text></TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))) }

          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setFavoritesModalVisible(false)}><Text>Close</Text></TouchableOpacity>
          </View>

        </View></View>
      </Modal>

      {/* Search Modal (simple) */}
      <Modal visible={searchModalVisible} transparent animationType="slide" onRequestClose={closeSearch}>
        <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: isDark ? '#0B1220' : '#FFF' }]}>
          <Text style={[styles.modalTitle, { color: isDark ? '#E2E8F0' : '#111' }]}>Search place</Text>
          <TextInput placeholder="Enter place or address (or lat,lng)" value={searchQuery} onChangeText={setSearchQuery} style={[styles.input, { backgroundColor: isDark ? '#111827' : '#F7FAFC', color: isDark ? '#E2E8F0' : '#111' }]} placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.modalButtonCancel} onPress={closeSearch}><Text>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonPrimary} onPress={performSearchAndCenter}><Text style={{ color: 'white' }}>Go</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

    </SafeAreaView>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { marginLeft: 8, fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { marginHorizontal: 6, alignItems: 'center' },
  iconLabel: { fontSize: 10 },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    marginLeft: 8,
  },
  shareButtonText: { color: 'white', marginLeft: 6, fontWeight: '600' },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },
  footer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationIcon: { marginRight: 12 },
  addressTitle: { fontSize: 14, fontWeight: '700' },
  address: { fontSize: 12 },
  smallText: { fontSize: 11 },
  footerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    position: 'absolute',
    right: 16,
    bottom: 110,
    backgroundColor: '#EF4444',
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  sosText: { color: 'white', fontWeight: '700', marginTop: 4, fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 40,
    padding: 16,
    borderRadius: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  durationOption: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    backgroundColor: '#F1F5F9',
  },
  durationSelected: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    backgroundColor: '#D1FAE5',
  },
  modalButtonPrimary: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2F855A',
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonCancel: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    minWidth: 120,
    alignItems: 'center',
  },
  input: { padding: 10, borderRadius: 8, marginVertical: 8 },
  verticalHistoryRight: {
    position: 'absolute',
    right: 16,
    bottom: 186,
    width: 56,
    padding: 8,
    borderRadius: 12,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyPanelExpanded: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 76,
    padding: 10,
    borderRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  smallAction: {
    padding: 6,
    marginLeft: 8,
  },
  playButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  historyContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    padding: 10,
    borderRadius: 12,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

// Notes for maintainers:
// - Reverse geocoding now requests addressdetails and constructs a long, componentized address (house number, road, neighbourhood, city, state, postcode, country).
// - Share and SOS now include multiple open links (Google Maps, Apple Maps, OpenStreetMap) and a geo: URI so the receiver can open the precise location in most mapping apps.
// - Marker description displays the full address string when available.
// - This keeps the one-shot share behaviour; for continuous live-sharing you'd need a backend or socket-based approach.
