# Transport Explorer - Interactive Route Visualization

This component demonstrates how to use the Ghana API's `getRouteDirections` endpoint with an interactive map interface built using React, MapLibre GL, and shadcn/ui components.

## Features

### 🗺️ Interactive Map

- **Interactive Selection**: Click on the map to select start and end locations
- **Real-time Route Visualization**: See your route drawn on the map with start/end markers
- **Ghana-focused**: Map bounds restricted to Ghana territory
- **MapLibre GL**: High-performance vector tile rendering

### 📍 Location Input Methods

- **Coordinates**: Enter latitude, longitude coordinates directly
- **Place Names**: Use location names (geocoded by the backend)
- **Map Clicking**: Interactive point selection on the map
- **Quick Selection**: Predefined sample locations for testing

### 🚗 Transport Modes

- **Driving (Car)**: Optimized for passenger vehicles
- **Driving (HGV)**: Heavy goods vehicle routing
- **Walking**: Pedestrian-friendly routes
- **Cycling**: Bicycle-optimized paths

### 📊 Route Information Display

- **Distance & Duration**: Total trip metrics
- **Fuel Cost Estimation**: For driving profiles (in GHS)
- **Turn-by-turn Directions**: Step-by-step navigation instructions
- **Route Provider**: Shows which routing service was used

### 🎨 UI Components (shadcn/ui)

- **Cards**: Clean layout for controls and information
- **Forms**: Structured input fields with validation
- **Buttons**: Interactive controls with icons
- **Select Dropdown**: Transport mode selection
- **Progress**: Loading states
- **Tooltips**: Helpful hints and instructions
- **Alerts**: Error messages and status updates
- **Badges**: Route profile and status indicators

## Technical Implementation

### API Integration

```typescript
// Example API call structure
const query = {
  start_lat: 5.6037,
  start_lng: -0.187,
  end_lat: 6.6885,
  end_lng: -1.6244,
  profile: "driving-car",
  instructions: true,
  geometry: true,
};

const response = await fetch(`/api/transport/route-directions?${params}`);
```

### Map Integration

- **react-map-gl**: React wrapper for MapLibre GL
- **Custom Markers**: Start (green) and end (red) location markers
- **Route Line**: GeoJSON LineString visualization
- **View Control**: Automatic bounds fitting for routes

### State Management

- **React Hooks**: useState for form data and map state
- **Loading States**: Progress indicators during API calls
- **Error Handling**: User-friendly error messages
- **Form Validation**: Input validation and bounds checking

## Usage Examples

### 1. Simple Route Query

1. Enter "Kwame Nkrumah Circle, Accra" as start location
2. Enter "Kumasi Central Market" as end location
3. Select "Driving (Car)" as transport mode
4. Click "Get Directions"

### 2. Interactive Map Selection

1. Click the map pin icon next to start location
2. Click on the map where you want to start
3. Repeat for end location
4. Get directions

### 3. Coordinate-based Query

1. Enter coordinates like "5.6037, -0.187" for start
2. Enter "6.6885, -1.6244" for end
3. Get directions

## Backend API Requirements

The component expects the backend to provide:

### Route Directions Endpoint

- **URL**: `GET /transport/route-directions`
- **Query Parameters**: start_lat, start_lng, end_lat, end_lng, start_name, end_name, profile, instructions, geometry
- **Response Format**: As defined in `RouteDirectionsResponseDto`

### CORS Configuration

Ensure the backend allows requests from the frontend domain.

### Error Handling

The backend should return appropriate HTTP status codes:

- 400: Invalid parameters
- 404: Location not found
- 503: Service unavailable

## Performance Considerations

### Optimization Features

- **Lazy Loading**: Map tiles loaded on demand
- **Debounced Requests**: Prevents excessive API calls
- **Efficient Rendering**: React optimization for map updates
- **Memory Management**: Proper cleanup of map resources

### Best Practices

- **Input Validation**: Client-side validation before API calls
- **Error Boundaries**: Graceful error handling
- **Responsive Design**: Works on desktop and mobile
- **Accessibility**: Keyboard navigation and screen reader support

## Development Setup

1. **Install Dependencies**:

   ```bash
   npm install react-map-gl maplibre-gl
   ```

2. **shadcn/ui Components**:

   ```bash
   npx shadcn@latest add card button input select badge progress skeleton tooltip alert
   ```

3. **API Proxy** (vite.config.ts):

   ```typescript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:3000',
         changeOrigin: true,
         rewrite: (path) => path.replace(/^\/api/, ''),
       },
     },
   }
   ```

4. **MapLibre Styles**:
   ```typescript
   import "maplibre-gl/dist/maplibre-gl.css";
   ```

## Testing

### Sample Test Cases

1. **Valid Routes**: Accra to Kumasi
2. **Invalid Coordinates**: Outside Ghana bounds
3. **Network Errors**: Offline/timeout scenarios
4. **Different Transport Modes**: Car vs Walking routes
5. **Edge Cases**: Same start/end location

### Manual Testing

- Use the `/transport` route for isolated testing
- Try different input methods (coordinates, names, map clicks)
- Test error scenarios (invalid locations, network issues)
- Verify map interactions and route visualization

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **WebGL Support**: Required for MapLibre GL
- **JavaScript**: ES2020+ features used
- **CSS**: Modern CSS Grid and Flexbox

## Security Considerations

- **Input Sanitization**: All user inputs validated
- **CORS Policy**: Proper cross-origin configuration
- **Rate Limiting**: Consider implementing on backend
- **API Keys**: No sensitive keys exposed to client

This transport explorer showcases the full capabilities of the Ghana API's routing services with a modern, interactive user interface.
