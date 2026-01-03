/**
 * Kıble yönünü hesaplar
 * @param {number} latitude - Kullanıcının enlemi
 * @param {number} longitude - Kullanıcının boylamı
 * @returns {number} Kıble yönü (derece olarak)
 */
export const calculateQiblaDirection = (latitude, longitude) => {
    // Kabe'nin koordinatları
    const KAABA_LAT = 21.4225; // Enlem
    const KAABA_LNG = 39.8262; // Boylam
  
    // Dereceyi radyana çevir
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;
  
    // Koordinatları radyana çevir
    const lat1 = toRad(latitude);
    const lat2 = toRad(KAABA_LAT);
    const dLng = toRad(KAABA_LNG - longitude);
  
    // Kıble yönü hesaplama formülü
    const y = Math.sin(dLng);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLng);
    
    let qiblaDirection = toDeg(Math.atan2(y, x));
  
    // 0-360 arası normalize et
    qiblaDirection = (qiblaDirection + 360) % 360;
  
    return qiblaDirection;
  };
  
  /**
   * Kabe'ye olan mesafeyi hesaplar
   * @param {number} latitude - Kullanıcının enlemi
   * @param {number} longitude - Kullanıcının boylamı
   * @returns {number} Mesafe (km olarak)
   */
  export const calculateDistanceToKaaba = (latitude, longitude) => {
    const KAABA_LAT = 21.4225;
    const KAABA_LNG = 39.8262;
    const R = 6371; // Dünya yarıçapı (km)
  
    const toRad = (deg) => (deg * Math.PI) / 180;
  
    const dLat = toRad(KAABA_LAT - latitude);
    const dLng = toRad(KAABA_LNG - longitude);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(latitude)) *
        Math.cos(toRad(KAABA_LAT)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
  
    return Math.round(distance);
  };