'use client'

import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, Circle, Marker, useJsApiLoader, Polyline, Polygon, Rectangle, InfoWindow } from '@react-google-maps/api'
import { POIMarker } from '@/types/game'

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
  radarCircle?: {
    center: { lat: number; lng: number }
    radiusMeters: number
  }
  fixedCircleCenter?: { lat: number; lng: number } // locked hiding zone center
  gameArea?: {
    center: { lat: number; lng: number }
    radiusMeters: number
  }
  restrictedAreas?: { center: { lat: number; lng: number }; radius: number }[]
  thermometerZones?: { point1: { lat: number; lng: number }; point2: { lat: number; lng: number }; isHotter: boolean }[]
  isHider?: boolean
  poiMarkers?: POIMarker[]
}

const libraries: ('drawing' | 'geometry' | 'places' | 'visualization')[] = ['drawing', 'geometry', 'places']

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
  gestureHandling = 'greedy',
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
  radarCircle,
  fixedCircleCenter,
  gameArea,
  restrictedAreas = [],
  thermometerZones = [],
  isHider = false,
  poiMarkers = [],
}: GoogleMapWrapperProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
    language: mapLanguage,
  })

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null)
  const [selectedPoiName, setSelectedPoiName] = useState<{ name: string, location: { lat: number, lng: number } } | null>(null)

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

  // Compute the Game Area outline (an immense polygon that shades EVERYTHING outside the game area)
  // We do this by creating an outer boundary that covers the world, and an inner "hole" for the game area
  const gameAreaPaths = useMemo(() => {
    if (!gameArea || !isLoaded || !window.google?.maps?.geometry) return null

    // Outer bound (localized box to avoid globe-spanning issues, clockwise)
    // 2 degrees is roughly 220km, plenty large to cover the view.
    const boundsOffset = 2
    const lat = gameArea.center.lat
    const lng = gameArea.center.lng
    const worldBounds = [
      { lat: lat + boundsOffset, lng: lng - boundsOffset }, // NW
      { lat: lat + boundsOffset, lng: lng + boundsOffset }, // NE
      { lat: lat - boundsOffset, lng: lng + boundsOffset }, // SE
      { lat: lat - boundsOffset, lng: lng - boundsOffset }, // SW
    ]

    // Inner bound (the game area circle, counter-clockwise to create a hole)
    const circlePoints = []
    const pointsCount = 64
    for (let i = pointsCount; i >= 0; i--) {
      const hdg = (i * 360) / pointsCount
      const point = google.maps.geometry.spherical.computeOffset(
        new google.maps.LatLng(gameArea.center.lat, gameArea.center.lng),
        gameArea.radiusMeters,
        hdg
      )
      circlePoints.push({ lat: point.lat(), lng: point.lng() })
    }

    return [worldBounds, circlePoints]
  }, [gameArea, isLoaded])

  // Inverted target for Hider's hiding zone
  const hidingZonePaths = useMemo(() => {
    if (!isLoaded || !window.google || !isHider || (!fixedCircleCenter && !hiderLocation)) return null

    const center = fixedCircleCenter || hiderLocation!

    // Outer bounds
    const boundsOffset = 1.0 // ~111km
    const lat = center.lat
    const lng = center.lng
    const worldBounds = [
      { lat: lat + boundsOffset, lng: lng - boundsOffset }, // NW
      { lat: lat + boundsOffset, lng: lng + boundsOffset }, // NE
      { lat: lat - boundsOffset, lng: lng + boundsOffset }, // SE
      { lat: lat - boundsOffset, lng: lng - boundsOffset }, // SW
    ]

    // Inner bound counter-clockwise
    const circlePoints = []
    const pointsCount = 64
    for (let i = pointsCount; i >= 0; i--) {
      const hdg = (i * 360) / pointsCount
      const point = window.google.maps.geometry.spherical.computeOffset(
        new window.google.maps.LatLng(center.lat, center.lng),
        circleRadiusMeters,
        hdg
      )
      circlePoints.push({ lat: point.lat(), lng: point.lng() })
    }

    return [worldBounds, circlePoints]
  }, [fixedCircleCenter, hiderLocation, circleRadiusMeters, isLoaded, isHider])

  // Compute Thermometer shaded regions (half-planes)
  const thermometerPolygons = useMemo(() => {
    if (!isLoaded || !window.google || !thermometerZones.length) return []

    return thermometerZones.map(zone => {
      // Shaded half is the side where the hider is NOT.
      // If "isHotter" is true, the hider is on the point2 side. So shade point1 side.
      // If "isHotter" is false, the hider is on the point1 side. So shade point2 side.
      const p1 = new window.google.maps.LatLng(zone.point1.lat, zone.point1.lng)
      const p2 = new window.google.maps.LatLng(zone.point2.lat, zone.point2.lng)

      const midpoint = window.google.maps.geometry.spherical.interpolate(p1, p2, 0.5)
      const heading = window.google.maps.geometry.spherical.computeHeading(p1, p2)

      // The perpendicular line passes through the midpoint and has heading +90 and -90
      // We want to project exactly away from the midpoint into the 'cold' side

      // If isHotter, hider is towards p2. Cold side is backwards from midpoint (heading + 180).
      // If NOT isHotter, hider is towards p1. Cold side is forwards from midpoint (heading).
      const coldDirection = zone.isHotter ? heading + 180 : heading

      // Draw a rectangle shading that half of the game map
      const BIG_DIST = 200000 // 200 km, large enough for any game zone but prevents globe-wrapping distortion

      const leftMid = window.google.maps.geometry.spherical.computeOffset(midpoint, BIG_DIST, coldDirection - 90)
      const rightMid = window.google.maps.geometry.spherical.computeOffset(midpoint, BIG_DIST, coldDirection + 90)

      const farLeft = window.google.maps.geometry.spherical.computeOffset(leftMid, BIG_DIST, coldDirection)
      const farRight = window.google.maps.geometry.spherical.computeOffset(rightMid, BIG_DIST, coldDirection)

      return [midpoint, rightMid, farRight, farLeft, leftMid, midpoint].map(ll => ({ lat: ll.lat(), lng: ll.lng() }))
    })
  }, [thermometerZones, isLoaded])

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      setMapInstance(map)
      if (onLoad) {
        onLoad(map)
      }
    },
    [onLoad]
  )

  useEffect(() => {
    if (!mapInstance || !isLoaded || !window.google?.maps) return

    if (showTransitLayer) {
      if (!transitLayerRef.current) {
        transitLayerRef.current = new google.maps.TransitLayer()
      }
      transitLayerRef.current.setMap(mapInstance)
    } else {
      if (transitLayerRef.current) {
        transitLayerRef.current.setMap(null)
      }
    }
  }, [mapInstance, isLoaded, showTransitLayer])

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

      {/* Hiding zone circle — fixed after travel phase, live during travel */}
      {(fixedCircleCenter || hiderLocation) && !isHider && (
        <Circle
          center={fixedCircleCenter || hiderLocation!}
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

      {/* Hiding zone inverted contour (for Hider only) */}
      {(fixedCircleCenter || hiderLocation) && isHider && hidingZonePaths && (
        <Polygon
          paths={hidingZonePaths}
          options={{
            fillColor: circleColor,
            fillOpacity: circleOpacity,
            strokeColor: circleStrokeColor,
            strokeOpacity: circleStrokeOpacity,
            strokeWeight: circleStrokeWeight,
            clickable: false
          }}
        />
      )}

      {/* Game area inverted contour */}
      {gameAreaPaths && (
        <Polygon
          paths={gameAreaPaths}
          options={{
            fillColor: '#000000',
            fillOpacity: 0.3,
            strokeColor: '#ef4444',
            strokeWeight: 3,
            strokeOpacity: 0.8,
            clickable: false
          }}
        />
      )}

      {/* Thermometer Zones */}
      {thermometerPolygons.map((path, idx) => (
        <Polygon
          key={`thermometer-${idx}`}
          paths={path}
          options={{
            fillColor: '#b91c1c', // red-700
            fillOpacity: 0.15,
            strokeColor: '#ef4444', // red-500
            strokeWeight: 2,
            strokeOpacity: 0.6,
            clickable: false
          }}
        />
      ))}

      {/* Radar question circle — centered on asking seeker */}
      {radarCircle && (
        <Circle
          center={radarCircle.center}
          radius={radarCircle.radiusMeters}
          options={{
            fillColor: '#06b6d4',
            fillOpacity: 0.08,
            strokeColor: '#06b6d4',
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      )}

      {/* Restricted Areas (from answered 'No' radar questions) */}
      {restrictedAreas.map((area, idx) => (
        <Circle
          key={`restricted-${idx}`}
          center={area.center}
          radius={area.radius}
          options={{
            fillColor: '#ef4444',
            fillOpacity: 0.15,
            strokeColor: '#ef4444',
            strokeOpacity: 0.5,
            strokeWeight: 2,
          }}
        />
      ))}

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

      {/* Target POIs for Seekers relative to matching/measuring questions */}
      {poiMarkers.map((poi) => {
        if (poi.type === 'area' && poi.bounds) {
          return (
            <Rectangle
              key={poi.id}
              bounds={poi.bounds}
              options={{
                fillColor: '#d946ef', // fuchsia-500
                fillOpacity: 0.3,
                strokeColor: '#d946ef',
                strokeOpacity: 0.9,
                strokeWeight: 3,
                clickable: false,
                zIndex: 50,
              }}
            />
          )
        } else if (poi.type === 'point' && poi.center) {
          return (
            <Marker
              key={poi.id}
              position={poi.center}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                scaledSize: window.google ? new window.google.maps.Size(32, 32) : undefined
              }}
              zIndex={50}
              title={poi.name || 'Target POI'}
              onClick={() => setSelectedPoiName({ name: poi.name || 'Target POI', location: poi.center! })}
            />
          )
        } else if (poi.type === 'measuring_circles' && poi.circles) {
          const isFurther = poi.answerStatus === 'FURTHER';
          const circleColor = isFurther ? '#ef4444' : '#22c55e'; // red-500 or green-500

          return (
            <React.Fragment key={poi.id}>
              {poi.circles.map((circle, idx) => (
                <Circle
                  key={`circle-${poi.id}-${idx}`}
                  center={circle.center}
                  radius={circle.radius}
                  options={{
                    fillColor: circleColor,
                    fillOpacity: 0.3,
                    strokeColor: circleColor,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    clickable: false,
                    zIndex: 45,
                  }}
                />
              ))}
            </React.Fragment>
          )
        } else if (poi.type === 'matching_points' && poi.points) {
          const isNo = poi.answerStatus === 'NO';

          return (
            <React.Fragment key={poi.id}>
              {poi.points.map((pt, idx) => {
                const pinUrl = (isNo || !pt.isMatch)
                  ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';

                return (
                  <Marker
                    key={`match-${poi.id}-${idx}`}
                    position={pt.center}
                    icon={{
                      url: pinUrl,
                      scaledSize: window.google ? new window.google.maps.Size(40, 40) : undefined
                    }}
                    zIndex={50}
                    title={pt.name}
                    onClick={() => setSelectedPoiName({ name: pt.name || 'Target', location: pt.center })}
                  />
                )
              })}
            </React.Fragment>
          )
        }
        return null
      })}

      {/* InfoWindow for clicked POIs */}
      {selectedPoiName && (
        <InfoWindow
          position={selectedPoiName.location}
          onCloseClick={() => setSelectedPoiName(null)}
          options={{
            pixelOffset: window.google ? new window.google.maps.Size(0, -32) : undefined
          }}
        >
          <div className="p-1 text-gray-900 font-bold max-w-xs text-sm">
            {selectedPoiName.name}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
