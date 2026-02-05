# Google Maps Customization Guide

This guide explains how to customize the Google Maps in your Hide and Seek app.

## Customization Options

### 1. Map Style Customization

Edit `components/GoogleMapWrapper.tsx` - the `mapOptions` object (lines 53-75):

#### Map Type
Change the map type by adding `mapTypeId`:
```typescript
mapOptions = {
  mapTypeId: 'roadmap', // Options: 'roadmap', 'satellite', 'hybrid', 'terrain'
  // ... other options
}
```

#### Custom Map Styles
You can customize colors, hide/show features, and create dark mode:

```typescript
styles: [
  // Hide points of interest labels
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  // Show transit labels
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  // Dark mode example
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
]
```

**Popular style presets:**
- **Dark Mode**: Use the styles above
- **Minimal**: Hide all labels and POIs
- **Colorful**: Customize road colors, water colors, etc.

### 2. Map Controls

Control which UI elements appear on the map:

```typescript
mapOptions = {
  zoomControl: true,        // Show/hide zoom buttons
  mapTypeControl: true,    // Show/hide map type selector
  streetViewControl: false, // Show/hide Street View pegman
  fullscreenControl: true, // Show/hide fullscreen button
  disableDefaultUI: false, // Hide all default controls
  clickableIcons: false,   // Make map icons clickable
}
```

### 3. Marker Customization

#### Hider Marker (Green)
Located in `GoogleMapWrapper.tsx` lines 132-144:

```typescript
<Marker
  position={hiderLocation}
  icon={{
    path: google.maps.SymbolPath.CIRCLE,
    scale: 6,                    // Size (1-10 recommended)
    fillColor: '#10b981',        // Green color
    fillOpacity: 1,              // 0-1
    strokeColor: '#ffffff',       // Border color
    strokeWeight: 2,             // Border thickness
  }}
/>
```

**Custom marker options:**
- Use custom SVG path: `path: 'M 0,0 L 0,10 L 10,10 Z'`
- Use image: `url: '/path/to/icon.png', scaledSize: new google.maps.Size(32, 32)`
- Use predefined shapes: `google.maps.SymbolPath.CIRCLE`, `BACKWARD_CLOSED_ARROW`, etc.

#### Seeker Marker (Red)
Located in `GoogleMapWrapper.tsx` lines 147-161:

```typescript
<Marker
  position={seekerLoc}
  icon={{
    path: google.maps.SymbolPath.CIRCLE,
    scale: 6,
    fillColor: '#ef4444',        // Red color
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  }}
/>
```

#### Radar Marker (Yellow border)
Located in `GoogleMapWrapper.tsx` lines 164-176:

```typescript
<Marker
  position={hiderLocation}
  icon={{
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,                    // Larger when revealed
    fillColor: '#10b981',
    fillOpacity: 1,
    strokeColor: '#fbbf24',      // Yellow border
    strokeWeight: 4,             // Thicker border
  }}
/>
```

### 4. Hiding Zone Circle Customization

Located in `GoogleMapWrapper.tsx` lines 179-191:

```typescript
<Circle
  center={hiderLocation}
  radius={circleRadiusMeters}   // 500 meters default
  options={{
    fillColor: '#ff0000',        // Red fill
    fillOpacity: 0.1,            // 10% opacity
    strokeColor: '#ff0000',      // Red border
    strokeOpacity: 0.5,          // 50% opacity
    strokeWeight: 2,             // Border thickness
  }}
/>
```

**Change circle properties:**
- `fillColor`: Any hex color (e.g., `'#00ff00'` for green)
- `fillOpacity`: 0.0 to 1.0 (0 = transparent, 1 = opaque)
- `strokeColor`: Border color
- `strokeOpacity`: Border opacity
- `strokeWeight`: Border thickness in pixels

### 5. Transit Layer (Subway Lines)

The transit layer is enabled in `HiderInterface.tsx` and `SeekerInterface.tsx`:

```typescript
onLoad={(map) => {
  setMapReady(true)
  const transitLayer = new google.maps.TransitLayer()
  transitLayer.setMap(map)  // Shows subway/metro lines
}}
```

**To disable transit layer:**
- Remove or comment out the `transitLayer.setMap(map)` line

**To toggle transit layer:**
```typescript
const [showTransit, setShowTransit] = useState(true)

onLoad={(map) => {
  setMapReady(true)
  const transitLayer = new google.maps.TransitLayer()
  if (showTransit) {
    transitLayer.setMap(map)
  }
}}
```

### 6. Default Zoom Level

Change the initial zoom in `HiderInterface.tsx` and `SeekerInterface.tsx`:

```typescript
<GoogleMapWrapper
  center={{ lat: centerLat, lng: centerLng }}
  zoom={15}  // Change this (1-20, higher = more zoomed in)
  // ...
/>
```

**Zoom levels:**
- `1`: World view
- `5`: Country/region
- `10`: City
- `15`: Streets (default)
- `20`: Buildings

### 7. Map Container Style

Located in `GoogleMapWrapper.tsx` line 123:

```typescript
<GoogleMap
  mapContainerStyle={{ width: '100%', height: '100%' }}
  // Change to custom dimensions if needed
/>
```

## Quick Customization Examples

### Dark Mode Map
Add to `mapOptions.styles` in `GoogleMapWrapper.tsx`:

```typescript
styles: [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a688f' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#304a7d' }],
  },
]
```

### Minimal Map (Hide Everything)
```typescript
styles: [
  { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]
```

### Custom Marker Colors
Change marker colors in `GoogleMapWrapper.tsx`:
- Hider: `fillColor: '#10b981'` (green) → Change to any color
- Seeker: `fillColor: '#ef4444'` (red) → Change to any color
- Radar: `strokeColor: '#fbbf24'` (yellow) → Change to any color

### Change Circle to Different Color
In `GoogleMapWrapper.tsx` Circle options:
```typescript
fillColor: '#00ff00',    // Green instead of red
strokeColor: '#00ff00',  // Green border
```

## Advanced Customization

### Custom Map Themes
Use [Snazzy Maps](https://snazzymaps.com/) to find pre-made map styles:
1. Browse styles on Snazzy Maps
2. Copy the JSON style array
3. Replace `mapOptions.styles` in `GoogleMapWrapper.tsx`

### Custom Icons for Markers
Replace the icon path with a custom image:

```typescript
icon={{
  url: '/icons/hider-icon.png',
  scaledSize: new google.maps.Size(32, 32),
  anchor: new google.maps.Point(16, 16),
}}
```

### Multiple Map Types
Add a control to switch between map types:

```typescript
mapOptions = {
  mapTypeControl: true,
  mapTypeControlOptions: {
    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
    position: google.maps.ControlPosition.TOP_CENTER,
    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
  },
}
```

## Need Help?

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Map Style Reference](https://developers.google.com/maps/documentation/javascript/style-reference)
- [Snazzy Maps](https://snazzymaps.com/) - Pre-made map styles
