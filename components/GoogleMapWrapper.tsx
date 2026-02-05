'use client'

import { useMemo, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, Circle, Marker, useJsApiLoader, Polyline } from '@react-google-maps/api'

interface GoogleMapWrapperProps {
  center: { lat: number; lng: number }
  zoom?: number
  onLoad?: (map: google.maps.Map) => void
  onError?: (error: Error) => void
  children?: React.ReactNode
  hiderLocation?: { lat: number; lng: number } | null
  seekerLocations?: { [userId: string]: { lat: number; lng: number } }
  showHiderLocation?: boolean
  subwayLines?: Array<{
    id: string
    name: string
    color: string
    coordinates: Array<{ lat: number; lng: number }>
  }>
  subwayStations?: Array<{
    id: string
    name: string
    lat: number
    lng: number
  }>
  // Customization options
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
  showTransitLayer?: boolean
  customStyles?: google.maps.MapTypeStyle[]
  hiderMarkerColor?: string
  seekerMarkerColor?: string
  hiderMarkerStrokeColor?: string
  seekerMarkerStrokeColor?: string
  hiderMarkerStrokeWeight?: number
  seekerMarkerStrokeWeight?: number
  circleColor?: string
  circleStrokeColor?: string
  circleOpacity?: number
  circleStrokeOpacity?: number
  circleStrokeWeight?: number
  circleRadiusMeters?: number
  hiderMarkerSize?: number
  seekerMarkerSize?: number
  showZoomControl?: boolean
  showMapTypeControl?: boolean
  showStreetViewControl?: boolean
  showFullscreenControl?: boolean
  showPOILabels?: boolean
  showTransitLabels?: boolean
  showRoadLabels?: boolean
  showAdministrativeLabels?: boolean
  showWaterLabels?: boolean
  showLandscapeLabels?: boolean
  showTransitLines?: boolean
  showTransitStations?: boolean
  showBusStops?: boolean
  showTramStops?: boolean
  showSubwayStations?: boolean
  showRailStations?: boolean
  showBusLines?: boolean
  showTramLines?: boolean
  showSubwayLines?: boolean
  showRailLines?: boolean
  showRoads?: boolean
  showBuildings?: boolean
  showWater?: boolean
  showParks?: boolean
  showHighways?: boolean
  showLocalRoads?: boolean
  showArterialRoads?: boolean
  darkMode?: boolean
  minZoom?: number
  maxZoom?: number
  gestureHandling?: 'auto' | 'greedy' | 'none' | 'cooperative'
  disableDoubleClickZoom?: boolean
  disableScrollWheel?: boolean
  draggable?: boolean
  draggableCursor?: string
  draggingCursor?: string
  keyboardShortcuts?: boolean
  clickableIcons?: boolean
  mapLanguage?: string
  tilt?: number
  heading?: number
}

const libraries: ('drawing' | 'geometry' | 'places' | 'visualization')[] = ['drawing', 'geometry']

export default function GoogleMapWrapper({
  center,
  zoom = 15,
  onLoad,
  onError,
  children,
  hiderLocation,
  seekerLocations,
  showHiderLocation = false,
  subwayLines = [],
  subwayStations = [],
  mapTypeId = 'roadmap',
  showTransitLayer = true,
  customStyles,
  hiderMarkerColor = '#10b981',
  seekerMarkerColor = '#ef4444',
  hiderMarkerStrokeColor = '#ffffff',
  seekerMarkerStrokeColor = '#ffffff',
  hiderMarkerStrokeWeight = 2,
  seekerMarkerStrokeWeight = 2,
  circleColor = '#ff0000',
  circleStrokeColor = '#ff0000',
  circleOpacity = 0.1,
  circleStrokeOpacity = 0.5,
  circleStrokeWeight = 2,
  circleRadiusMeters = 500,
  hiderMarkerSize = 6,
  seekerMarkerSize = 6,
  showZoomControl = true,
  showMapTypeControl = false,
  showStreetViewControl = false,
  showFullscreenControl = false,
  showPOILabels = false,
  showTransitLabels = true,
  showRoadLabels = true,
  showAdministrativeLabels = true,
  showWaterLabels = true,
  showLandscapeLabels = true,
  showTransitLines = true,
  showTransitStations = true,
  showBusStops = true,
  showTramStops = true,
  showSubwayStations = true,
  showRailStations = true,
  showBusLines = true,
  showTramLines = true,
  showSubwayLines = true,
  showRailLines = true,
  showRoads = true,
  showBuildings = true,
  showWater = true,
  showParks = true,
  showHighways = true,
  showLocalRoads = true,
  showArterialRoads = true,
  darkMode = false,
  minZoom = 1,
  maxZoom = 20,
  gestureHandling = 'auto',
  disableDoubleClickZoom = false,
  disableScrollWheel = false,
  draggable = true,
  draggableCursor = 'default',
  draggingCursor = 'move',
  keyboardShortcuts = true,
  clickableIcons = false,
  mapLanguage = 'en',
  tilt = 0,
  heading = 0,
}: GoogleMapWrapperProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
  })

  const mapOptions = useMemo<google.maps.MapOptions>(() => {
    const baseStyles: google.maps.MapTypeStyle[] = customStyles || []
    
    // Add POI label visibility
    if (!customStyles) {
      baseStyles.push({
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: showPOILabels ? 'on' : 'off' }],
      })
    }

    // Add transit label visibility
    if (!customStyles) {
      baseStyles.push({
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: showTransitLabels ? 'on' : 'off' }],
      })
    }

    // Only apply feature visibility if not using custom styles
    if (!customStyles) {
      // Transit Lines visibility
      if (!showTransitLines) {
        baseStyles.push({
          featureType: 'transit.line',
          stylers: [{ visibility: 'off' }],
        })
      }

      // Transit Stations visibility
      // Note: Google Maps API limitations:
      // - transit.station.rail can hide rail/subway stations
      // - Bus stops and tram stops are part of transit.station but can't be easily separated
      // - The TransitLayer shows all transit features, and we can't filter by type
      
      if (!showTransitStations) {
        // Hide all transit stations
        baseStyles.push({
          featureType: 'transit.station',
          stylers: [{ visibility: 'off' }],
        })
      } else {
        // Hide rail/subway stations if disabled
        if (!showSubwayStations && !showRailStations) {
          baseStyles.push({
            featureType: 'transit.station.rail',
            stylers: [{ visibility: 'off' }],
          })
        } else {
          // Show rail stations only if at least one is enabled
          if (!showSubwayStations) {
            // Can't selectively hide just subway, so we show rail if rail is enabled
          }
          if (!showRailStations) {
            // Can't selectively hide just rail, so we show rail if subway is enabled
          }
        }
        
        // For bus/tram stops: Google Maps doesn't provide separate feature types
        // If both bus and tram stops are disabled, we could hide all transit.station
        // but that would also hide subway stations, so we can't do that
        // The best we can do is hide transit.station if ALL station types are disabled
        if (!showBusStops && !showTramStops && !showSubwayStations && !showRailStations) {
          baseStyles.push({
            featureType: 'transit.station',
            stylers: [{ visibility: 'off' }],
          })
        }
      }

      // Road labels
      if (!showRoadLabels) {
        baseStyles.push({
          featureType: 'road',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        })
      }

      // Administrative labels
      if (!showAdministrativeLabels) {
        baseStyles.push({
          featureType: 'administrative',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        })
      }

      // Water labels
      if (!showWaterLabels) {
        baseStyles.push({
          featureType: 'water',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        })
      }

      // Landscape labels
      if (!showLandscapeLabels) {
        baseStyles.push({
          featureType: 'landscape',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        })
        baseStyles.push({
          featureType: 'poi.park',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        })
      }

      // Roads visibility
      if (!showRoads) {
        baseStyles.push({
          featureType: 'road',
          stylers: [{ visibility: 'off' }],
        })
      } else {
        if (!showHighways) {
          baseStyles.push({
            featureType: 'road.highway',
            stylers: [{ visibility: 'off' }],
          })
        }
        if (!showArterialRoads) {
          baseStyles.push({
            featureType: 'road.arterial',
            stylers: [{ visibility: 'off' }],
          })
        }
        if (!showLocalRoads) {
          baseStyles.push({
            featureType: 'road.local',
            stylers: [{ visibility: 'off' }],
          })
        }
      }

      // Buildings
      if (!showBuildings) {
        baseStyles.push({
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }],
        })
        baseStyles.push({
          featureType: 'poi.attraction',
          stylers: [{ visibility: 'off' }],
        })
      }

      // Water
      if (!showWater) {
        baseStyles.push({
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ visibility: 'off' }],
        })
      }

      // Parks
      if (!showParks) {
        baseStyles.push({
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ visibility: 'off' }],
        })
        baseStyles.push({
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ visibility: 'off' }],
        })
      }
    }

    // Add dark mode styles if enabled
    if (darkMode && !customStyles) {
      baseStyles.push(
        { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#4a688f' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
        { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
        { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#8b9dc3' }] },
        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] }
      )
    }

    return {
      disableDefaultUI: false,
      clickableIcons: clickableIcons,
      mapTypeControl: showMapTypeControl,
      streetViewControl: showStreetViewControl,
      fullscreenControl: showFullscreenControl,
      zoomControl: showZoomControl,
      mapTypeId: mapTypeId,
      styles: baseStyles,
      minZoom: minZoom,
      maxZoom: maxZoom,
      gestureHandling: gestureHandling,
      disableDoubleClickZoom: disableDoubleClickZoom,
      scrollwheel: !disableScrollWheel,
      draggable: draggable,
      draggableCursor: draggableCursor,
      draggingCursor: draggingCursor,
      keyboardShortcuts: keyboardShortcuts,
      language: mapLanguage,
      tilt: tilt,
      heading: heading,
    }
  }, [
    mapTypeId,
    customStyles,
    showPOILabels,
    showTransitLabels,
    showRoadLabels,
    showAdministrativeLabels,
    showWaterLabels,
    showLandscapeLabels,
    showTransitLines,
    showTransitStations,
    showBusStops,
    showTramStops,
    showSubwayStations,
    showRailStations,
    showBusLines,
    showTramLines,
    showSubwayLines,
    showRailLines,
    showRoads,
    showBuildings,
    showWater,
    showParks,
    showHighways,
    showLocalRoads,
    showArterialRoads,
    darkMode,
    showMapTypeControl,
    showStreetViewControl,
    showFullscreenControl,
    showZoomControl,
    minZoom,
    maxZoom,
    gestureHandling,
    disableDoubleClickZoom,
    disableScrollWheel,
    draggable,
    draggableCursor,
    draggingCursor,
    keyboardShortcuts,
    clickableIcons,
    mapLanguage,
    tilt,
    heading,
  ])

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      // Enable transit layer if requested
      if (showTransitLayer) {
        const transitLayer = new google.maps.TransitLayer()
        transitLayer.setMap(map)
      }
      if (onLoad) {
        onLoad(map)
      }
    },
    [onLoad, showTransitLayer]
  )

  if (loadError) {
    if (onError) {
      onError(new Error('Failed to load Google Maps'))
    }
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-400">Error loading Google Maps</p>
          <p className="text-sm text-gray-400 mt-2">Please check your API key</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p>Loading map...</p>
        </div>
      </div>
    )
  }

  if (!googleMapsApiKey) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-400">Google Maps API Key Missing</p>
          <p className="text-sm text-gray-400 mt-2">Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p>
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={zoom}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {children}
      
      {/* Hider location marker */}
      {hiderLocation && (
        <Marker
          position={hiderLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: hiderMarkerSize,
            fillColor: hiderMarkerColor,
            fillOpacity: 1,
            strokeColor: hiderMarkerStrokeColor,
            strokeWeight: hiderMarkerStrokeWeight,
          }}
        />
      )}

      {/* Seeker location markers */}
      {seekerLocations &&
        Object.entries(seekerLocations).map(([userId, seekerLoc]) => (
          <Marker
            key={userId}
            position={seekerLoc}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: seekerMarkerSize,
              fillColor: seekerMarkerColor,
              fillOpacity: 1,
              strokeColor: seekerMarkerStrokeColor,
              strokeWeight: seekerMarkerStrokeWeight,
            }}
          />
        ))}

      {/* Show hider location when radar question is active */}
      {showHiderLocation && hiderLocation && (
        <Marker
          position={hiderLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#fbbf24',
            strokeWeight: 4,
          }}
        />
      )}

      {/* Hiding zone circle */}
      {hiderLocation && (
        <Circle
          center={hiderLocation}
          radius={circleRadiusMeters}
          options={{
            fillColor: circleColor,
            fillOpacity: circleOpacity,
            strokeColor: circleStrokeColor,
            strokeOpacity: circleStrokeOpacity,
            strokeWeight: circleStrokeWeight,
          }}
        />
      )}

      {/* Subway lines */}
      {subwayLines.map((line) => {
        const path = line.coordinates.map((coord) => ({ lat: coord.lat, lng: coord.lng }))
        return (
          <Polyline
            key={line.id}
            path={path}
            options={{
              strokeColor: line.color,
              strokeOpacity: 0.9,
              strokeWeight: 5,
              zIndex: 1,
            }}
          />
        )
      })}

      {/* Subway stations */}
      {subwayStations.map((station) => (
        <Marker
          key={station.id}
          position={{ lat: station.lat, lng: station.lng }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: '#3b82f6',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
          title={station.name}
        />
      ))}
    </GoogleMap>
  )
}
