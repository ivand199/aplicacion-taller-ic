import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Alert, Image, ScrollView,
  Linking, Switch, Modal, ActivityIndicator, Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, setDoc, getDocs, where,
  getDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

// ------------------------------------------------------------
// CONFIGURACIÓN DE FIREBASE
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDdbPzNQkAqLgHmZmPq5i3qfKEJgJ_5p28",
  authDomain: "tallerapp-2a6bc.firebaseapp.com",
  projectId: "tallerapp-2a6bc",
  storageBucket: "tallerapp-2a6bc.appspot.com",
  messagingSenderId: "964175272985",
  appId: "1:964175272985:web:0a19a492b7a8f66c1aa230"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ------------------------------------------------------------
// CONFIGURACIÓN DE LA APP
// ------------------------------------------------------------
const ADMIN_SECRET = "megusta2024";
const WHATSAPP_NUMBER = "50768695311";
const COMPANY_NAME = "Servicios IC";

const SERVICES_LIST = [
  { id: 'aceite', icon: '🛢️', label: 'Cambio de aceite y filtros' },
  { id: 'frenos', icon: '🛞', label: 'Mantenimiento de frenos' },
  { id: 'suspension', icon: '🔧', label: 'Revisión de suspensión' },
  { id: 'diagnostico', icon: '💻', label: 'Diagnóstico electrónico' },
  { id: 'bateria', icon: '🔋', label: 'Cambio de batería' },
  { id: 'alineacion', icon: '⚙️', label: 'Alineación y balanceo' },
  { id: 'motor', icon: '🚗', label: 'Reparación de motor' },
  { id: 'completo', icon: '🏎️', label: 'Servicio completo' },
  { id: 'otro', icon: '✏️', label: 'Otro (especificar)' },
];

const ThemeContext = createContext();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------------------
function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      const theme = await AsyncStorage.getItem('@theme_mode');
      if (theme) setIsDarkMode(theme === 'dark');
      setIsLoading(false);
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem('@theme_mode', newMode ? 'dark' : 'light');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2B6CB0" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <MainApp isDarkMode={isDarkMode} />
    </ThemeContext.Provider>
  );
}

// ------------------------------------------------------------
// COMPONENTE PRINCIPAL DE LA APP
// ------------------------------------------------------------
function MainApp({ isDarkMode }) {
  // Estados de acceso
  const [inputPlate, setInputPlate] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [currentView, setCurrentView] = useState('welcome');
  const [loginMode, setLoginMode] = useState('cliente');
  const [expoPushToken, setExpoPushToken] = useState('');

  // Datos principales
  const [vehicles, setVehicles] = useState([]);
  const [clientVehicles, setClientVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [clientName, setClientName] = useState('');
  const [customerBalance, setCustomerBalance] = useState(0);

  // Búsqueda y filtros (admin)
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [sortBy, setSortBy] = useState('fecha');
  const [quickSearchPlate, setQuickSearchPlate] = useState('');

  // Citas
  const [appointments, setAppointments] = useState([]);
  const [clientAppointments, setClientAppointments] = useState([]);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentComment, setAppointmentComment] = useState('');
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Sugerencias
  const [suggestions, setSuggestions] = useState([]);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestionPhotos, setSuggestionPhotos] = useState([]);
  const [suggestionComment, setSuggestionComment] = useState('');

  // Cotizaciones
  const [quotes, setQuotes] = useState([]);
  const [clientQuotes, setClientQuotes] = useState([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quoteComment, setQuoteComment] = useState('');
  const [quotePhotos, setQuotePhotos] = useState([]);
  const [selectedQuoteVehicle, setSelectedQuoteVehicle] = useState(null);
  const [showClientQuotesModal, setShowClientQuotesModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showQuotesListModal, setShowQuotesListModal] = useState(false);
    // Formulario admin
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [phone, setPhone] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [status, setStatus] = useState('Recibido');
  const [photoUri, setPhotoUri] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [maintenanceKm, setMaintenanceKm] = useState('');
  const [maintenanceStatus, setMaintenanceStatus] = useState('al_dia');
  const [balance, setBalance] = useState('');

  // Promociones
  const [promotionData, setPromotionData] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [tempPromotionActive, setTempPromotionActive] = useState(false);
  const [tempPromotionMessage, setTempPromotionMessage] = useState('');
  const [tempPromotionExpires, setTempPromotionExpires] = useState('');

  // Historial
  const [historyModal, setHistoryModal] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState([]);

  // Selectores de fecha/hora
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  const themeStyles = getThemeStyles(isDarkMode);

  // --- Funciones de credenciales ---
  const saveCredentials = async (plate, passwordHash) => {
    try {
      if (plate) await AsyncStorage.setItem('@client_plate', plate);
      if (passwordHash) await AsyncStorage.setItem('@admin_password_hash', passwordHash);
    } catch (error) { console.log(error); }
  };

  const loadCredentials = async () => {
    try {
      const plate = await AsyncStorage.getItem('@client_plate');
      const passwordHash = await AsyncStorage.getItem('@admin_password_hash');
      return { plate, passwordHash };
    } catch (error) { return { plate: null, passwordHash: null }; }
  };

  const clearCredentials = async () => {
    try {
      await AsyncStorage.removeItem('@client_plate');
      await AsyncStorage.removeItem('@admin_password_hash');
    } catch (error) { console.log(error); }
  };

  const hashPassword = (password) => btoa(password + 'salty_2026');

  // --- Listeners de Firestore ---
  useEffect(() => {
    const q = query(collection(db, 'vehicles'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setVehicles(list);
      if (currentView === 'client') filterClientVehicles(list);
    });
    return unsub;
  }, [currentView]);

  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAppointments(list);
      if (currentView === 'client') filterClientAppointments(list);
      if (currentView === 'admin') setPendingAppointments(list.filter(a => a.status === 'pending'));
    });
    return unsub;
  }, [currentView]);

  useEffect(() => {
    const q = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSuggestions(list);
      if (currentView === 'client') filterClientSuggestions(list);
    });
    return unsub;
  }, [currentView]);

  useEffect(() => {
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setQuotes(list);
      if (currentView === 'client') filterClientQuotes(list);
    });
    return unsub;
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'client') {
      const promoRef = doc(db, 'promotions', 'activa');
      const unsub = onSnapshot(promoRef, (d) => {
        setPromotionData(d.exists() ? d.data() : null);
      });
      return unsub;
    }
  }, [currentView]);

  useEffect(() => {
    const check = async () => {
      const { plate: savedP, passwordHash } = await loadCredentials();
      if (savedP) setInputPlate(savedP);
      if (passwordHash) setInputPassword('******');
    };
    check();
  }, []);

  // --- Funciones de filtrado ---
  const filterClientVehicles = (all, searchP = null) => {
    const p = searchP || inputPlate;
    if (!p) return;
    const main = all.find(v => v.plate.toUpperCase() === p.toUpperCase());
    if (main) {
      setClientName(main.name);
      setClientVehicles(all.filter(v => v.name === main.name));
      setSelectedVehicle(main);
      AsyncStorage.setItem('@client_plate', p);
      registerForPushNotifications(main.name);
      fetchCustomerBalance(main.name);
    } else {
      setClientVehicles([]); setSelectedVehicle(null); setClientName('');
    }
  };

  const filterClientAppointments = (all) => {
    if (!selectedVehicle) return;
    setClientAppointments(all.filter(a => a.plate === selectedVehicle.plate));
  };

  const filterClientSuggestions = (all) => {
    if (!selectedVehicle) return;
    setClientSuggestions(all.filter(s => s.plate === selectedVehicle.plate && s.status !== 'atendido'));
  };

  const filterClientQuotes = (all) => {
    if (!selectedVehicle) return;
    setClientQuotes(all.filter(q => q.plate === selectedVehicle.plate && q.status === 'pending'));
  };

  const fetchCustomerBalance = async (clientName) => {
    try {
      const d = await getDoc(doc(db, 'customers', clientName));
      setCustomerBalance(d.exists() ? d.data().balance || 0 : 0);
    } catch { setCustomerBalance(0); }
  };

  // --- Notificaciones ---
  const registerForPushNotifications = async (clientName) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);
      await setDoc(doc(db, 'pushTokens', token), { ownerName: clientName, token, updatedAt: new Date() });
    } catch (e) { console.log(e); }
  };

  const sendPushNotification = async (clientName, title, body, data = {}) => {
    try {
      const snap = await getDocs(query(collection(db, 'pushTokens'), where('ownerName', '==', clientName)));
      const msgs = [];
      snap.forEach(d => msgs.push({ to: d.data().token, sound: 'default', title, body, data, vibrate: [0, 500] }));
      if (msgs.length > 0) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgs),
        });
      }
    } catch (e) { console.log(e); }
  };

  const sendPromotionNotification = async (message) => {
    try {
      const snap = await getDocs(collection(db, 'pushTokens'));
      const msgs = [];
      snap.forEach(d => msgs.push({
        to: d.data().token, sound: 'default',
        title: '🎉 Promoción especial', body: message,
        data: { type: 'promotion' }, vibrate: [0, 500],
      }));
      if (msgs.length > 0) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msgs),
        });
      }
    } catch (e) { console.log(e); }
  };
    // --- Navegación y login ---
  const handleLogin = async () => {
    Keyboard.dismiss();
    if (loginMode === 'mecanico') {
      if (inputPassword === ADMIN_SECRET || inputPassword === '******') {
        setCurrentView('admin');
        setInputPassword('');
        await AsyncStorage.removeItem('@client_plate');
        await saveCredentials(null, hashPassword(ADMIN_SECRET));
        await registerForPushNotifications('MECANICO');
      } else Alert.alert('Error', 'Contraseña incorrecta.');
    } else {
      if (inputPlate.trim().length >= 3 && inputName.trim() !== '') {
        const p = inputPlate.trim().toUpperCase();
        setInputPlate(p);
        if (!vehicles.some(v => v.plate.toUpperCase() === p)) await registerClient(inputName.trim(), p);
        setCurrentView('client');
        setInputPassword('');
        filterClientVehicles(vehicles, p);
        await saveCredentials(p, null);
      } else Alert.alert('Error', 'Completa todos los campos.');
    }
  };

  const registerClient = async (name, plate) => {
    try {
      await addDoc(collection(db, 'vehicles'), {
        name, plate, status: 'Recibido', progressStep: 1, progressPercent: 0,
        visits: 0, createdAt: new Date(), updatedAt: new Date(),
      });
      await setDoc(doc(db, 'customers', name), { name, balance: 0, updatedAt: new Date() });
      Alert.alert('✅ Registro exitoso', 'Bienvenido a Servicios IC');
    } catch (e) { console.log(e); }
  };

  const goToWelcome = async () => {
    setCurrentView('welcome');
    setClientVehicles([]); setSelectedVehicle(null); setClientName('');
    setInputPlate(''); setInputName(''); setInputPassword('');
    setClientAppointments([]); setClientSuggestions([]);
    setLoginMode('cliente');
    await clearCredentials();
  };

  // --- Agregar vehículo ---
  const addVehicle = async () => {
    if (!inputPlate.trim() || !inputName.trim()) return Alert.alert('Error', 'Ingresa nombre y placa.');
    const p = inputPlate.trim().toUpperCase();
    if (vehicles.some(v => v.plate === p)) return Alert.alert('Error', 'Esta placa ya existe.');
    try {
      await addDoc(collection(db, 'vehicles'), {
        name: inputName.trim(), plate: p, status: 'Recibido', progressStep: 1,
        progressPercent: 0, visits: 0, createdAt: new Date(), updatedAt: new Date(),
      });
      Alert.alert('✅ Vehículo agregado', `Placa ${p} registrada.`);
      setInputPlate('');
    } catch (e) { console.log(e); }
  };

  // --- Admin: Foto + Guardar ---
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso necesario');
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 });
    if (!r.canceled) setPhotoUri(r.assets[0].uri);
  };

  const uploadImageAndSave = async (vehicleData) => {
    let photoURL = null;
    if (photoUri) {
      const res = await fetch(photoUri);
      const blob = await res.blob();
      const refFile = ref(storage, `vehicles/${Date.now()}.jpg`);
      await uploadBytes(refFile, blob);
      photoURL = await getDownloadURL(refFile);
    }
    let calcMaint = maintenanceKm;
    if (currentKm && !maintenanceKm) calcMaint = parseInt(currentKm) + 5000;
    const finalData = {
      ...vehicleData, photoURL, phone: phone.trim() || '', estimatedTime,
      currentKm: currentKm ? parseInt(currentKm) : null,
      maintenanceKm: calcMaint, maintenanceStatus,
      customerBalance: balance ? parseFloat(balance) : 0,
      visits: vehicleData.visits || 0, updatedAt: new Date(),
    };
    if (editingId) {
      await updateDoc(doc(db, 'vehicles', editingId), finalData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, 'vehicles'), { ...finalData, createdAt: new Date(), visits: 0 });
    }
    if (name.trim() && balance) {
      await setDoc(doc(db, 'customers', name.trim()), { name: name.trim(), balance: parseFloat(balance) || 0, updatedAt: new Date() }, { merge: true });
    }
    resetForm();
    Alert.alert('✅ Éxito', 'Vehículo guardado.');
  };

  const resetForm = () => {
    setName(''); setPlate(''); setPhone(''); setCurrentKm(''); setStatus('Recibido');
    setPhotoUri(null); setEstimatedTime(''); setMaintenanceKm('');
    setMaintenanceStatus('al_dia'); setBalance(''); setEditingId(null);
  };

  const deleteVehicle = (id) => {
    Alert.alert('Eliminar', '¿Quitar este vehículo?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', onPress: () => deleteDoc(doc(db, 'vehicles', id)), style: 'destructive' },
    ]);
  };

  // --- Recordatorio de mantenimiento ---
  const scheduleMaintenanceReminder = async (clientName, plate) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔧 Mantenimiento trimestral',
          body: `Hola ${clientName}, tu vehículo ${plate} ya necesita su mantenimiento. ¡Agenda tu cita!`,
          sound: 'default',
          data: { type: 'maintenance_reminder', plate },
        },
        trigger: { seconds: 60 * 60 * 24 * 90 },
      });
    } catch (e) { console.log(e); }
  };

  // --- Stepper (progreso) ---
  const updateProgress = async (vehicleId, step) => {
    const stepMap = {
      'Recibido': { step: 1, percent: 0 }, 'Diagnóstico': { step: 2, percent: 25 },
      'Reparación': { step: 3, percent: 50 }, 'Pruebas': { step: 4, percent: 75 },
      'Listo': { step: 5, percent: 100 },
    };
    const prog = stepMap[step];
    if (!prog) return;
    if (step === 'Listo') {
      Alert.prompt('Kilometraje actual', 'Ingresa el kilometraje actual:', [
        { text: 'Cancelar' },
        { text: 'Guardar', onPress: async (km) => {
          const kmN = parseInt(km);
          if (!isNaN(kmN) && kmN > 0) {
            const nextKm = kmN + 5000;
            await updateDoc(doc(db, 'vehicles', vehicleId), {
              status: 'Listo', progressStep: 5, progressPercent: 100,
              currentKm: kmN, maintenanceKm: nextKm, updatedAt: new Date(),
            });
            const v = vehicles.find(x => x.id === vehicleId);
            if (v) {
              await sendPushNotification(v.name, '🔧 ¡Tu auto está listo!',
                `El vehículo ${v.plate} ya está terminado.`, { plate: v.plate });
              await scheduleMaintenanceReminder(v.name, v.plate);
              Alert.alert('✅ Notificado', `Se avisó a ${v.name}.`);
            }
          }
        }},
      ], 'plain-text');
    } else {
      await updateDoc(doc(db, 'vehicles', vehicleId), {
        status: step, progressStep: prog.step, progressPercent: prog.percent, updatedAt: new Date(),
      });
    }
  };

  // --- Citas ---
  const approveAppointment = async (id) => {
    try {
      const app = appointments.find(a => a.id === id);
      if (!app) return;
      await updateDoc(doc(db, 'appointments', id), { status: 'confirmed', confirmedAt: new Date() });
      if (!vehicles.some(v => v.plate === app.plate)) {
        await addDoc(collection(db, 'vehicles'), {
          name: app.clientName, plate: app.plate, status: 'Recibido',
          progressStep: 1, progressPercent: 0, visits: 0, createdAt: new Date(), updatedAt: new Date(),
        });
      }
      await sendPushNotification(app.clientName, '✅ Cita confirmada',
        `Tu cita para ${app.serviceType} fue confirmada para ${app.date} a las ${app.time}.`, { plate: app.plate });
      Alert.alert('✅ Aprobada', 'El cliente ha sido notificado.');
    } catch (e) { console.log(e); }
  };

  const rejectAppointment = async (id) => {
    try {
      const app = appointments.find(a => a.id === id);
      if (!app) return;
      await updateDoc(doc(db, 'appointments', id), { status: 'rejected', rejectedAt: new Date() });
      await sendPushNotification(app.clientName, '❌ Cita rechazada',
        `No podemos atender tu cita para ${app.serviceType} en ${app.date}. Intenta otra fecha.`, { plate: app.plate });
      Alert.alert('❌ Rechazada', 'El cliente ha sido notificado.');
    } catch (e) { console.log(e); }
  };

  const requestAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return Alert.alert('Error', 'Faltan datos.');
    if (!selectedVehicle) return Alert.alert('Error', 'No hay vehículo.');
    try {
      await addDoc(collection(db, 'appointments'), {
        clientName: selectedVehicle.name, plate: selectedVehicle.plate,
        serviceType: selectedService.label, serviceId: selectedService.id,
        date: selectedDate, time: selectedTime, comment: appointmentComment,
        status: 'pending', createdAt: new Date(), vehicleId: selectedVehicle.id,
      });
      Alert.alert('✅ Enviada', 'Te confirmaremos pronto.');
      setCurrentView('client');
      setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setAppointmentComment('');
    } catch (e) { console.log(e); }
  };

  const cancelAppointment = async (id) => {
    Alert.alert('Cancelar', '¿Cancelar esta cita?', [
      { text: 'No' },
      { text: 'Sí', onPress: async () => {
        await updateDoc(doc(db, 'appointments', id), { status: 'cancelled', cancelledAt: new Date() });
        Alert.alert('✅ Cancelada');
      }, style: 'destructive' },
    ]);
  };
    // --- Sugerencias ---
  const takeSuggestionPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 });
    if (!r.canceled) setSuggestionPhotos([...suggestionPhotos, r.assets[0].uri]);
  };

  const uploadSuggestion = async (vehicle) => {
    if (!suggestionComment.trim() && suggestionPhotos.length === 0) return Alert.alert('Error', 'Añade comentario o foto.');
    try {
      const urls = [];
      for (const uri of suggestionPhotos) {
        const res = await fetch(uri);
        const blob = await res.blob();
        const refFile = ref(storage, `suggestions/${vehicle.id}/${Date.now()}.jpg`);
        await uploadBytes(refFile, blob);
        urls.push(await getDownloadURL(refFile));
      }
      await addDoc(collection(db, 'suggestions'), {
        vehicleId: vehicle.id, clientName: vehicle.name, plate: vehicle.plate,
        comment: suggestionComment, photos: urls, status: 'pendiente', createdAt: new Date(),
      });
      setSuggestionComment(''); setSuggestionPhotos([]);
      Alert.alert('✅ Enviada', 'El cliente la verá.');
    } catch (e) { console.log(e); }
  };

  const markSuggestionAttended = async (id) => {
    await updateDoc(doc(db, 'suggestions', id), { status: 'atendido', attendedAt: new Date() });
    Alert.alert('✅ Gracias');
  };

  // --- Historial ---
  const viewHistory = async (id) => {
    try {
      const snap = await getDocs(query(collection(db, 'vehicles', id, 'history'), orderBy('completedAt', 'desc')));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setVehicleHistory(list); setHistoryModal(true);
    } catch (e) { console.log(e); }
  };

  // --- Cotizaciones ---
  const takeQuotePhoto = async () => {
    if (quotePhotos.length >= 5) return Alert.alert('Máximo 5 fotos');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 });
    if (!r.canceled) setQuotePhotos([...quotePhotos, r.assets[0].uri]);
  };

  const sendQuote = async () => {
    if (!quoteText.trim()) return Alert.alert('Error', 'Escribe el detalle.');
    if (!selectedQuoteVehicle) return;
    try {
      const urls = [];
      for (const uri of quotePhotos) {
        const res = await fetch(uri);
        const blob = await res.blob();
        const refFile = ref(storage, `quotes/${selectedQuoteVehicle.id}/${Date.now()}.jpg`);
        await uploadBytes(refFile, blob);
        urls.push(await getDownloadURL(refFile));
      }
      await addDoc(collection(db, 'quotes'), {
        vehicleId: selectedQuoteVehicle.id, clientName: selectedQuoteVehicle.name,
        plate: selectedQuoteVehicle.plate, text: quoteText, comment: quoteComment,
        photos: urls, status: 'pending', viewedByClient: false, createdAt: new Date(),
      });
      await sendPushNotification(selectedQuoteVehicle.name, '💰 Nueva cotización',
        `Tienes una nueva cotización para tu vehículo ${selectedQuoteVehicle.plate}.`,
        { plate: selectedQuoteVehicle.plate, type: 'quote' });
      setQuoteText(''); setQuoteComment(''); setQuotePhotos([]);
      setSelectedQuoteVehicle(null); setShowQuoteModal(false);
      Alert.alert('✅ Enviada', 'El cliente fue notificado.');
    } catch (e) { console.log(e); }
  };

  const approveQuote = async (id) => {
    try {
      const q = quotes.find(x => x.id === id);
      if (!q) return;
      await updateDoc(doc(db, 'quotes', id), { status: 'approved', approvedAt: new Date() });
      await updateDoc(doc(db, 'vehicles', q.vehicleId), {
        status: 'Reparación', progressStep: 3, progressPercent: 50, updatedAt: new Date(),
      });
      setShowClientQuotesModal(false);
      Alert.alert('✅ Aprobada', 'El taller ha sido notificado.');
    } catch (e) { console.log(e); }
  };

  const rejectQuote = async (id) => {
    if (!rejectionReason.trim()) return Alert.alert('Error', 'Escribe el motivo.');
    try {
      const q = quotes.find(x => x.id === id);
      if (!q) return;
      await updateDoc(doc(db, 'quotes', id), {
        status: 'rejected', rejectionReason, rejectedAt: new Date(),
      });
      await sendPushNotification('MECANICO', '❌ Cotización rechazada',
        `${q.clientName} rechazó la cotización de ${q.plate}. Motivo: ${rejectionReason}`,
        { plate: q.plate, type: 'quote_rejected' });
      setRejectionReason(''); setShowClientQuotesModal(false);
      Alert.alert('❌ Rechazada', 'El taller ha sido notificado.');
    } catch (e) { console.log(e); }
  };

  // --- Promociones ---
  const savePromotion = async () => {
    if (tempPromotionActive && !tempPromotionMessage.trim()) return Alert.alert('Error', 'Escribe un mensaje.');
    try {
      await setDoc(doc(db, 'promotions', 'activa'), {
        active: tempPromotionActive, message: tempPromotionMessage,
        expiresAt: tempPromotionExpires, updatedAt: new Date(),
      });
      if (tempPromotionActive) await sendPromotionNotification(tempPromotionMessage);
      Alert.alert('✅ Guardada', 'Los clientes verán la promoción.');
      setShowPromotionModal(false);
    } catch (e) { console.log(e); }
  };

  // --- Búsqueda rápida ---
  const handleQuickSearch = () => {
    if (!quickSearchPlate.trim()) return Alert.alert('Error', 'Ingresa una placa.');
    const p = quickSearchPlate.trim().toUpperCase();
    const found = vehicles.find(v => v.plate === p);
    if (found) {
      setName(found.name); setPlate(found.plate); setPhone(found.phone || '');
      setCurrentKm(found.currentKm ? found.currentKm.toString() : '');
      setStatus(found.status); setEstimatedTime(found.estimatedTime || '');
      setMaintenanceKm(found.maintenanceKm ? found.maintenanceKm.toString() : '');
      setMaintenanceStatus(found.maintenanceStatus || 'al_dia');
      setBalance(found.customerBalance !== undefined ? found.customerBalance.toString() : '');
      setEditingId(found.id); setPhotoUri(null);
      Alert.alert('✅ Encontrado', `${found.name} - ${found.plate}`);
    } else Alert.alert('❌ No encontrado', 'No hay vehículo con esa placa.');
    setQuickSearchPlate('');
  };

  // --- Filtros y ordenación ---
  const getFilteredAndSorted = () => {
    let f = [...vehicles];
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      f = f.filter(v => v.name.toLowerCase().includes(s) || v.plate.toLowerCase().includes(s));
    }
    if (filterStatus === 'Deudores') f = f.filter(v => (v.customerBalance || 0) < 0);
    else if (filterStatus !== 'Todos') f = f.filter(v => v.status === filterStatus);
    switch (sortBy) {
      case 'nombre': f.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'placa': f.sort((a, b) => a.plate.localeCompare(b.plate)); break;
      case 'estado': {
        const ord = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo'];
        f.sort((a, b) => ord.indexOf(a.status) - ord.indexOf(b.status)); break;
      }
      default: f.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return f;
  };

  const getTotalDebt = () => vehicles.filter(v => (v.customerBalance || 0) < 0).reduce((s, v) => s + Math.abs(v.customerBalance), 0);

  const formatDate = (s) => {
    if (!s) return 'Seleccionar fecha';
    const d = new Date(s);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  };
    // ==================== RENDER ====================
  if (currentView === 'loading') {
    return <View style={[styles.loading, themeStyles.background]}><ActivityIndicator size="large" color="#2B6CB0" /></View>;
  }

  // ===== WELCOME =====
  if (currentView === 'welcome') {
    return (
      <View style={[styles.container, styles.welcomeContainer, themeStyles.background, { paddingTop: StatusBar.currentHeight || 0, paddingBottom: 20 }]}>
        <View style={[styles.welcomeBox, themeStyles.card]}>
          <Text style={[styles.logo, themeStyles.text]}>🔧 {COMPANY_NAME}</Text>
          <Text style={[styles.slogan, themeStyles.subText]}>Bienvenido</Text>
          <View style={styles.welcomeButtons}>
            <TouchableOpacity style={styles.welcomeBtn} onPress={() => { setCurrentView('login'); setLoginMode('cliente'); }}>
              <Text style={styles.welcomeBtnText}>👤 Soy cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.welcomeBtn, styles.welcomeBtnAdmin]} onPress={() => { setCurrentView('login'); setLoginMode('mecanico'); }}>
              <Text style={styles.welcomeBtnText}>🔧 Soy mecánico</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ===== LOGIN =====
  if (currentView === 'login') {
    const isAdminMode = loginMode === 'mecanico';
    return (
      <View style={[styles.container, styles.loginContainer, themeStyles.background, { paddingTop: StatusBar.currentHeight || 0, paddingBottom: 20 }]}>
        <View style={[styles.loginBox, themeStyles.card]}>
          <Text style={[styles.logo, themeStyles.text]}>🔧 {COMPANY_NAME}</Text>
          <Text style={[styles.slogan, themeStyles.subText]}>{isAdminMode ? 'Ingresa tu contraseña' : 'Ingresa tu placa'}</Text>
          {!isAdminMode && (
            <>
              <TextInput style={[styles.input, themeStyles.input]} placeholder="👤 Nombre completo" placeholderTextColor={isDarkMode ? '#888' : '#999'} value={inputName} onChangeText={setInputName} />
              <TextInput style={[styles.input, themeStyles.input]} placeholder="🚗 Placa (ABC-123)" placeholderTextColor={isDarkMode ? '#888' : '#999'} value={inputPlate} onChangeText={setInputPlate} autoCapitalize="characters" />
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Entrar como cliente</Text>
              </TouchableOpacity>
            </>
          )}
          {isAdminMode && (
            <>
              <TextInput style={[styles.input, themeStyles.input]} placeholder="🔑 Contraseña" placeholderTextColor={isDarkMode ? '#888' : '#999'} value={inputPassword} onChangeText={setInputPassword} secureTextEntry />
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Entrar como mecánico</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={() => { setInputPassword(''); setInputPlate(''); setInputName(''); setCurrentView('welcome'); setLoginMode('cliente'); }}>
            <Text style={[styles.backText, themeStyles.link]}>⬅ Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== CLIENTE =====
  if (currentView === 'client') {
    return (
      <View style={[styles.container, themeStyles.background, { flex: 1, paddingTop: StatusBar.currentHeight || 0, paddingBottom: 20 }]}>
        <View style={styles.clientHeader}>
          <View>
            <Text style={[styles.header, themeStyles.text]}>{COMPANY_NAME}</Text>
            <Text style={[styles.greeting, themeStyles.subText]}>¡Hola, {clientName || 'Cliente'}!</Text>
          </View>
          <TouchableOpacity onPress={goToWelcome}><Text style={[styles.backBtn, themeStyles.link]}>Salir</Text></TouchableOpacity>
        </View>

        {promotionData?.active && (
          <View style={styles.promoBanner}>
            <Text style={styles.promoEmoji}>🎉</Text>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>OFERTA ESPECIAL</Text>
              <Text style={styles.promoMessage}>{promotionData.message}</Text>
              {promotionData.expiresAt && <Text style={styles.promoExpires}>Válido hasta: {promotionData.expiresAt}</Text>}
            </View>
          </View>
        )}

        {clientVehicles.length === 0 ? (
          <View style={styles.notFoundCard}>
            <Text style={[styles.notFound, themeStyles.text]}>❌ No encontramos vehículos para "{inputPlate}"</Text>
            <TextInput style={[styles.input, themeStyles.input, { marginTop: 20 }]} placeholder="👤 Tu nombre" value={inputName} onChangeText={setInputName} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
            <TextInput style={[styles.input, themeStyles.input]} placeholder="🚗 Placa del vehículo" value={inputPlate} onChangeText={setInputPlate} autoCapitalize="characters" placeholderTextColor={isDarkMode ? '#888' : '#999'} />
            <TouchableOpacity style={styles.saveBtn} onPress={addVehicle}><Text style={styles.saveBtnText}>Registrar vehículo</Text></TouchableOpacity>
            <TouchableOpacity style={styles.retryBtn} onPress={goToWelcome}><Text style={styles.retryBtnText}>Volver</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={clientVehicles}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.carouselCard, themeStyles.card, selectedVehicle?.id === item.id && styles.carouselCardSelected]}
                  onPress={() => { setSelectedVehicle(item); fetchCustomerBalance(item.name); }}
                >
                  {item.photoURL ? <Image source={{ uri: item.photoURL }} style={styles.carouselImg} /> : (
                    <View style={[styles.carouselImg, styles.carouselPlaceholder]}><Text style={{ fontSize: 30 }}>🚗</Text></View>
                  )}
                  <Text style={[styles.carouselPlate, themeStyles.text]}>{item.plate}</Text>
                  <View style={[styles.badgeSmall, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.badgeTextSmall}>{item.status}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.addVehicleBtn}
              onPress={() => Alert.prompt('Agregar vehículo', 'Ingresa la placa:', [
                { text: 'Cancelar' },
                { text: 'Agregar', onPress: async (plate) => {
                  if (!plate || plate.trim().length < 3) return Alert.alert('Error', 'Placa inválida');
                  const p = plate.trim().toUpperCase();
                  if (vehicles.some(v => v.plate === p)) return Alert.alert('Error', 'Ya está registrada');
                  await addDoc(collection(db, 'vehicles'), {
                    name: clientName, plate: p, status: 'Recibido', progressStep: 1,
                    progressPercent: 0, visits: 0, createdAt: new Date(), updatedAt: new Date(),
                  });
                  Alert.alert('✅ Agregado', `Placa ${p}`);
                }},
              ], 'plain-text')}
            >
              <Text style={styles.addVehicleBtnText}>➕ Agregar vehículo</Text>
            </TouchableOpacity>
                        {selectedVehicle && (
              <ScrollView style={[styles.clientCardContainer, themeStyles.card]} contentContainerStyle={[styles.clientCardContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
                {selectedVehicle.photoURL ? <Image source={{ uri: selectedVehicle.photoURL }} style={styles.clientImg} /> : (
                  <View style={[styles.clientImg, styles.clientPlaceholder]}><Text style={{ fontSize: 50 }}>🚗</Text></View>
                )}
                <Text style={[styles.clientName, themeStyles.text]}>{selectedVehicle.name}</Text>
                <Text style={[styles.clientPlate, themeStyles.subText]}>🚗 Placa: {selectedVehicle.plate}</Text>

                <View style={styles.balanceContainer}>
                  <Text style={[styles.balanceText,
                    customerBalance > 0 && styles.balancePositive,
                    customerBalance < 0 && styles.balanceNegative,
                    customerBalance === 0 && styles.balanceZero]}>
                    {customerBalance > 0 ? `🟢 Crédito: $${customerBalance}` :
                     customerBalance < 0 ? `🔴 Deuda: $${Math.abs(customerBalance)}` : `⚪ Saldo: $0`}
                  </Text>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressSteps}>
                    {['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo'].map((step, index) => {
                      const n = index + 1;
                      const act = selectedVehicle.progressStep >= n;
                      return (
                        <View key={step} style={styles.progressStepItem}>
                          <View style={[styles.progressCircle, act && styles.progressCircleActive, { backgroundColor: act ? getStatusColor(step) : '#E2E8F0' }]}>
                            <Text style={[styles.progressCircleText, act && { color: '#FFF' }]}>{act ? '✓' : n}</Text>
                          </View>
                          <Text style={[styles.progressStepLabel, act && styles.progressStepLabelActive]}>{step}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.progressBar}><View style={[styles.progressBarFill, { width: `${selectedVehicle.progressPercent || 0}%` }]} /></View>
                  <Text style={[styles.progressPercent, themeStyles.text]}>{selectedVehicle.progressPercent || 0}%</Text>
                </View>

                {selectedVehicle.maintenanceKm && (
                  <View style={[styles.maintenanceCard, { borderLeftColor: getMaintenanceStatusColor(selectedVehicle.maintenanceStatus || 'al_dia') }]}>
                    <Text style={[styles.maintenanceLabel, themeStyles.text]}>🔧 Próximo mantenimiento:</Text>
                    <Text style={[styles.maintenanceKm, { color: getMaintenanceStatusColor(selectedVehicle.maintenanceStatus || 'al_dia') }]}>
                      {selectedVehicle.maintenanceKm.toLocaleString()} km
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.whatsappBtn} onPress={() => {
                  const msg = `Hola, soy ${selectedVehicle.name} y vengo a retirar mi vehículo ${selectedVehicle.plate}`;
                  Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`)
                    .catch(() => Alert.alert('WhatsApp no instalado'));
                }}>
                  <Text style={styles.whatsappBtnText}>💬 Contactar por WhatsApp</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => setCurrentView('schedule')}>
                <Text style={styles.actionBtnText}>📋 Solicitar servicio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.outlineBtn, themeStyles.card]} onPress={() => { filterClientAppointments(appointments); setShowAppointmentsModal(true); }}>
                <Text style={[styles.actionBtnOutlineText, themeStyles.text]}>📅 Mis citas {clientAppointments.length > 0 && `(${clientAppointments.filter(a => a.status === 'pending').length})`}</Text>
              </TouchableOpacity>
              {clientSuggestions.length > 0 && (
                <TouchableOpacity style={[styles.actionBtn, styles.suggestionBtn]} onPress={() => setShowSuggestionsModal(true)}>
                  <Text style={styles.actionBtnText}>📌 Sugerencias ({clientSuggestions.length})</Text>
                </TouchableOpacity>
              )}
              {clientQuotes.length > 0 && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ED8936' }]} onPress={async () => {
                  for (const q of clientQuotes) {
                    if (q.status === 'pending') await updateDoc(doc(db, 'quotes', q.id), { viewedByClient: true, viewedAt: new Date() });
                  }
                  setShowClientQuotesModal(true);
                }}>
                  <Text style={styles.actionBtnText}>💰 Cotización pendiente ({clientQuotes.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* MODAL MIS CITAS */}
            <Modal visible={showAppointmentsModal} animationType="slide" transparent onRequestClose={() => setShowAppointmentsModal(false)}>
              <View style={styles.modalContainer}>
                <View style={[styles.modalContent, themeStyles.card]}>
                  <Text style={[styles.modalTitle, themeStyles.text]}>📅 Mis citas</Text>
                  <FlatList
                    data={clientAppointments}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    renderItem={({ item }) => (
                      <View style={[styles.appointmentItem, themeStyles.card]}>
                        <Text style={[styles.appointmentService, themeStyles.text]}>{item.serviceType}</Text>
                        <Text style={[styles.appointmentDetails, themeStyles.subText]}>📅 {item.date} - ⏰ {item.time}</Text>
                        <View style={[styles.appointmentStatus, { backgroundColor: getAppointmentColor(item.status) }]}>
                          <Text style={styles.appointmentStatusText}>
                            {item.status === 'pending' ? '⏳ Pendiente' : item.status === 'confirmed' ? '✅ Confirmada' : item.status === 'rejected' ? '❌ Rechazada' : '🚫 Cancelada'}
                          </Text>
                        </View>
                        {item.status === 'pending' && (
                          <TouchableOpacity style={styles.cancelAppointmentBtn} onPress={() => cancelAppointment(item.id)}>
                            <Text style={styles.cancelAppointmentBtnText}>Cancelar cita</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  />
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnClose]} onPress={() => setShowAppointmentsModal(false)}>
                    <Text style={styles.modalBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* MODAL SUGERENCIAS */}
            <Modal visible={showSuggestionsModal} animationType="slide" transparent onRequestClose={() => setShowSuggestionsModal(false)}>
              <View style={styles.modalContainer}>
                <View style={[styles.modalContent, themeStyles.card]}>
                  <Text style={[styles.modalTitle, themeStyles.text]}>📌 Sugerencias</Text>
                  <FlatList
                    data={clientSuggestions}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    renderItem={({ item }) => (
                      <View style={[styles.suggestionItem, themeStyles.card]}>
                        <Text style={[styles.suggestionComment, themeStyles.text]}>{item.comment}</Text>
                        {item.photos?.length > 0 && (
                          <ScrollView horizontal style={{ marginVertical: 8 }}>
                            {item.photos.map((p, i) => <Image key={i} source={{ uri: p }} style={styles.suggestionPhoto} />)}
                          </ScrollView>
                        )}
                        <TouchableOpacity style={styles.suggestionAttendBtn} onPress={() => markSuggestionAttended(item.id)}>
                          <Text style={styles.suggestionAttendBtnText}>Marcar atendido</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnClose]} onPress={() => setShowSuggestionsModal(false)}>
                    <Text style={styles.modalBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* MODAL COTIZACIONES CLIENTE */}
            <Modal visible={showClientQuotesModal} animationType="slide" transparent onRequestClose={() => setShowClientQuotesModal(false)}>
              <View style={styles.modalContainer}>
                <View style={[styles.modalContent, themeStyles.card]}>
                  <Text style={[styles.modalTitle, themeStyles.text]}>💰 Cotización</Text>
                  <FlatList
                    data={clientQuotes}
                    keyExtractor={(i) => i.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                      <View style={[styles.suggestionItem, themeStyles.card]}>
                        <Text style={[styles.suggestionComment, themeStyles.text]}>{item.text}</Text>
                        {item.comment ? <Text style={[styles.suggestionComment, themeStyles.subText, { marginTop: 8 }]}>💬 {item.comment}</Text> : null}
                        {item.photos?.length > 0 && (
                          <ScrollView horizontal style={{ marginVertical: 8 }}>
                            {item.photos.map((p, i) => <Image key={i} source={{ uri: p }} style={{ width: 100, height: 100, borderRadius: 8, marginRight: 6 }} />)}
                          </ScrollView>
                        )}
                        <Text style={[styles.modalLabel, themeStyles.text, { marginTop: 10 }]}>Motivo del rechazo (si aplica):</Text>
                        <TextInput style={[styles.input, themeStyles.input]} placeholder="Escribe aquí si rechazas" value={rejectionReason} onChangeText={setRejectionReason} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
                        <View style={styles.modalButtons}>
                          <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => rejectQuote(item.id)}>
                            <Text style={styles.modalBtnText}>❌ Rechazar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={() => approveQuote(item.id)}>
                            <Text style={styles.modalBtnText}>✅ Aprobar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnClose]} onPress={() => setShowClientQuotesModal(false)}>
                    <Text style={styles.modalBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </>
        )}
      </View>
    );
  }
    // ===== SCHEDULE (agendar cita) =====
  if (currentView === 'schedule') {
    return (
      <View style={[styles.container, themeStyles.background, { flex: 1, paddingTop: StatusBar.currentHeight || 0, paddingBottom: 20 }]}>
        <View style={styles.scheduleHeader}>
          <TouchableOpacity onPress={() => setCurrentView('client')} style={styles.backButton}>
            <Text style={[styles.backButtonText, themeStyles.link]}>⬅ Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.header, themeStyles.text]}>📋 Solicitar servicio</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scheduleContent}>
          <Text style={[styles.modalLabel, themeStyles.text]}>Selecciona el servicio:</Text>
          <View style={styles.servicesGrid}>
            {SERVICES_LIST.map((item) => (
              <TouchableOpacity key={item.id}
                style={[styles.serviceItemGrid, themeStyles.card, selectedService?.id === item.id && styles.serviceItemSelected]}
                onPress={() => setSelectedService(item)}>
                <Text style={styles.serviceIcon}>{item.icon}</Text>
                <Text style={[styles.serviceLabel, themeStyles.text]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.modalLabel, themeStyles.text]}>Selecciona fecha y hora:</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={[styles.dateOption, themeStyles.card, selectedDate && styles.dateOptionSelected]} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.dateOptionText, themeStyles.text]}>{selectedDate ? formatDate(selectedDate) : '📅 Seleccionar fecha'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.timeOption, themeStyles.card, selectedTime && styles.timeOptionSelected]} onPress={() => setShowTimePicker(true)}>
              <Text style={[styles.timeOptionText, themeStyles.text]}>{selectedTime || '⏰ Seleccionar hora'}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker value={tempDate} mode="date" display="default"
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (e.type === 'set' && d) {
                  setTempDate(d);
                  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
                  setSelectedDate(`${y}-${m}-${dd}`);
                }
              }} />
          )}
          {showTimePicker && (
            <DateTimePicker value={tempTime} mode="time" display="default"
              onChange={(e, d) => {
                setShowTimePicker(false);
                if (e.type === 'set' && d) {
                  setTempTime(d);
                  const h = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
                  setSelectedTime(`${h}:${mm}`);
                }
              }} />
          )}

          <TextInput style={[styles.input, themeStyles.input]} placeholder="Comentarios adicionales" value={appointmentComment} onChangeText={setAppointmentComment} multiline numberOfLines={3} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => { setCurrentView('client'); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setAppointmentComment(''); }}>
              <Text style={styles.modalBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={requestAppointment}>
              <Text style={styles.modalBtnText}>Enviar solicitud</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }
    // ===== ADMIN =====
  if (currentView === 'admin') {
    const filtered = getFilteredAndSorted();
    const totalDebt = getTotalDebt();
    return (
      <View style={[styles.container, themeStyles.background, { flex: 1, paddingTop: StatusBar.currentHeight || 0, paddingBottom: 20 }]}>
        <View style={styles.adminHeader}>
          <Text style={[styles.header, themeStyles.text]}>🔧 Panel</Text>
          <View style={styles.adminControls}>
            <TouchableOpacity style={[styles.promoBtn, { backgroundColor: '#805AD5' }]} onPress={() => setShowQuotesListModal(true)}>
              <Text style={styles.promoBtnText}>💰 ({quotes.filter(q => q.status === 'pending').length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.promoBtn} onPress={() => {
              setTempPromotionActive(promotionData?.active || false);
              setTempPromotionMessage(promotionData?.message || '');
              setTempPromotionExpires(promotionData?.expiresAt || '');
              setShowPromotionModal(true);
            }}>
              <Text style={styles.promoBtnText}>📢 Promo</Text>
            </TouchableOpacity>
            <Switch value={isDarkMode} onValueChange={() => { const c = useContext(ThemeContext); c.toggleTheme(); }} trackColor={{ false: '#767577', true: '#2B6CB0' }} thumbColor={isDarkMode ? '#FFF' : '#f4f3f4'} />
            <TouchableOpacity onPress={goToWelcome}><Text style={[styles.logout, themeStyles.link]}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickSearchContainer}>
          <TextInput style={[styles.quickSearchInput, themeStyles.input]} placeholder="🔍 Placa" placeholderTextColor={isDarkMode ? '#888' : '#999'} value={quickSearchPlate} onChangeText={setQuickSearchPlate} autoCapitalize="characters" onSubmitEditing={handleQuickSearch} />
          <TouchableOpacity style={styles.quickSearchBtn} onPress={handleQuickSearch}><Text style={styles.quickSearchBtnText}>Buscar</Text></TouchableOpacity>
        </View>

        {pendingAppointments.length > 0 && (
          <TouchableOpacity style={styles.pendingBadge} onPress={() => setShowPendingModal(true)}>
            <Text style={styles.pendingBadgeText}>📅 {pendingAppointments.length} cita(s) pendiente(s)</Text>
          </TouchableOpacity>
        )}

        <ScrollView style={[styles.form, { maxHeight: 320 }]} contentContainerStyle={[styles.formContent, themeStyles.card]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, themeStyles.text]}>{editingId ? '✏️ Editar' : '📝 Registrar'}</Text>
          <TextInput style={[styles.input, themeStyles.input]} placeholder="Nombre" value={name} onChangeText={setName} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
          <TextInput style={[styles.input, themeStyles.input]} placeholder="Placa (ABC-123)" value={plate} onChangeText={setPlate} autoCapitalize="characters" placeholderTextColor={isDarkMode ? '#888' : '#999'} />
          <TextInput style={[styles.input, themeStyles.input]} placeholder="📱 Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={isDarkMode ? '#888' : '#999'} />
          <Text style={[styles.label, themeStyles.text]}>Kilometraje actual:</Text>
          <TextInput style={[styles.input, themeStyles.input]} placeholder="Ej: 22500" value={currentKm} onChangeText={setCurrentKm} keyboardType="numeric" placeholderTextColor={isDarkMode ? '#888' : '#999'} />

          <Text style={[styles.label, themeStyles.text]}>Estado:</Text>
          <View style={styles.row}>
            {['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo'].map(s => (
              <TouchableOpacity key={s} style={[styles.statusBtn, { backgroundColor: status === s ? getStatusColor(s) : isDarkMode ? '#444' : '#DDD' }]} onPress={() => setStatus(s)}>
                <Text style={[styles.statusBtnText, { color: status === s ? '#FFF' : isDarkMode ? '#FFF' : '#333' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput style={[styles.input, themeStyles.input]} placeholder="Tiempo estimado" value={estimatedTime} onChangeText={setEstimatedTime} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
          <Text style={[styles.label, themeStyles.text]}>Próximo mantenimiento (se auto-calcula con km + 5000):</Text>
          <View style={styles.kmButtons}>
            {[5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000].map(km => (
              <TouchableOpacity key={km} style={[styles.kmBtn, parseInt(maintenanceKm) === km && styles.kmBtnSelected]} onPress={() => setMaintenanceKm(km.toString())}>
                <Text style={[styles.kmBtnText, parseInt(maintenanceKm) === km && styles.kmBtnTextSelected]}>{km.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, themeStyles.input]} placeholder="O valor personalizado" value={maintenanceKm} onChangeText={setMaintenanceKm} keyboardType="numeric" placeholderTextColor={isDarkMode ? '#888' : '#999'} />

          <Text style={[styles.label, themeStyles.text]}>Estado del mantenimiento:</Text>
          <View style={styles.row}>
            {[{id:'al_dia',label:'🟢 Al día',c:'#2ECC71'},{id:'proximo',label:'🟡 Próximo',c:'#F39C12'},{id:'vencido',label:'🔴 Vencido',c:'#E53E3E'}].map(it => (
              <TouchableOpacity key={it.id} style={[styles.statusBtn, { backgroundColor: maintenanceStatus === it.id ? it.c : isDarkMode ? '#444' : '#DDD', flex: 1, marginHorizontal: 4 }]} onPress={() => setMaintenanceStatus(it.id)}>
                <Text style={[styles.statusBtnText, { color: maintenanceStatus === it.id ? '#FFF' : isDarkMode ? '#FFF' : '#333' }]}>{it.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, themeStyles.text]}>Saldo del cliente:</Text>
          <TextInput style={[styles.input, themeStyles.input]} placeholder="Ej: -150 o 50" value={balance} onChangeText={setBalance} keyboardType="numeric" placeholderTextColor={isDarkMode ? '#888' : '#999'} />

          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.photoBtnText}>📸 Tomar foto del vehículo</Text>
          </TouchableOpacity>
          {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}

          <TouchableOpacity style={styles.saveBtn} onPress={() => {
            if (!name.trim() || !plate.trim()) return Alert.alert('Error', 'Nombre y placa obligatorios');
            uploadImageAndSave({ name, plate: plate.toUpperCase(), status });
          }}>
            <Text style={styles.saveBtnText}>{editingId ? 'ACTUALIZAR' : 'AGREGAR VEHÍCULO'}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity onPress={resetForm}>
              <Text style={[styles.cancel, themeStyles.link]}>Cancelar edición</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
                <View style={styles.searchSection}>
          <TextInput style={[styles.searchInput, themeStyles.input]} placeholder="🔍 Buscar por placa o nombre..." value={searchText} onChangeText={setSearchText} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
          <View style={styles.filterRow}>
            {['Todos', '💸 Deudores', 'Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo'].map(f => (
              <TouchableOpacity key={f} style={[styles.filterChip, filterStatus === f && styles.filterChipActive]} onPress={() => setFilterStatus(f)}>
                <Text style={[styles.filterChipText, filterStatus === f && styles.filterChipTextActive]}>{f === 'Todos' ? '📋 Todos' : f === '💸 Deudores' ? '💸 Deudores' : getStatusEmoji(f) + ' ' + f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {filterStatus === 'Deudores' && totalDebt > 0 && (
            <View style={styles.debtTotalContainer}><Text style={styles.debtTotalText}>💰 Total: ${totalDebt.toFixed(2)}</Text></View>
          )}
          <View style={styles.sortRow}>
            <Text style={[styles.sortLabel, themeStyles.subText]}>Ordenar:</Text>
            {['fecha', 'nombre', 'placa', 'estado'].map(opt => (
              <TouchableOpacity key={opt} style={[styles.sortChip, sortBy === opt && styles.sortChipActive]} onPress={() => setSortBy(opt)}>
                <Text style={[styles.sortChipText, sortBy === opt && styles.sortChipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.listTitle, themeStyles.text]}>📋 Vehículos ({filtered.length})</Text>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          style={[styles.list, { flex: 1 }]}
          contentContainerStyle={{ paddingBottom: 150 }}
          renderItem={({ item }) => (
            <View style={[styles.vehicleCard, themeStyles.card]}>
              {item.photoURL ? <Image source={{ uri: item.photoURL }} style={styles.vehicleImg} /> : (
                <View style={[styles.vehicleImg, styles.cardPlaceholder]}><Text style={{ fontSize: 24 }}>🚗</Text></View>
              )}
              <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleName, themeStyles.text]}>{item.name}</Text>
                <Text style={[styles.vehiclePlate, themeStyles.subText]}>{item.plate}</Text>
                <View style={styles.vehicleMeta}>
                  <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusBadgeSmallText}>{item.status}</Text>
                  </View>
                  {item.maintenanceKm && <Text style={[styles.vehicleMetaText, themeStyles.subText]}>🔧 {item.maintenanceKm} km</Text>}
                  {item.visits >= 3 && <Text style={styles.vehicleMetaText}>🌟 {item.visits}</Text>}
                </View>
                {quotes.filter(q => q.plate === item.plate).slice(0,1).map((q, idx) => {
                  let c = '#F39C12', t = '💰 Enviada';
                  if (q.status === 'approved') { c = '#2ECC71'; t = '✅ Aprobada'; }
                  else if (q.status === 'rejected') { c = '#E53E3E'; t = '❌ Rechazada'; }
                  else if (q.viewedByClient) { c = '#3498DB'; t = '👀 Vista'; }
                  return (
                    <View key={idx} style={[styles.statusBadgeSmall, { backgroundColor: c, marginTop: 4 }]}>
                      <Text style={styles.statusBadgeSmallText}>{t}</Text>
                    </View>
                  );
                })}
                {(item.customerBalance || 0) < 0 && (
                  <Text style={[styles.debtText, { marginTop: 4 }]}>🔴 Deuda: ${Math.abs(item.customerBalance || 0).toFixed(2)}</Text>
                )}
                {item.phone && <Text style={[styles.phoneText, themeStyles.subText]}>📞 {item.phone}</Text>}
              </View>
              <View style={styles.vehicleActions}>
                <TouchableOpacity onPress={() => viewHistory(item.id)}><Text style={styles.actionIcon}>📜</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setName(item.name); setPlate(item.plate); setPhone(item.phone || '');
                  setCurrentKm(item.currentKm ? item.currentKm.toString() : '');
                  setStatus(item.status); setEstimatedTime(item.estimatedTime || '');
                  setMaintenanceKm(item.maintenanceKm ? item.maintenanceKm.toString() : '');
                  setMaintenanceStatus(item.maintenanceStatus || 'al_dia');
                  setBalance(item.customerBalance !== undefined ? item.customerBalance.toString() : '');
                  setEditingId(item.id); setPhotoUri(null);
                }}><Text style={styles.actionIcon}>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteVehicle(item.id)}><Text style={styles.actionIcon}>🗑️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setSelectedQuoteVehicle(item); setQuoteText(''); setQuoteComment(''); setQuotePhotos([]);
                  setShowQuoteModal(true);
                }}><Text style={styles.actionIcon}>💰</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Sugerencia', 'Escribe un comentario:', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Tomar foto y enviar', onPress: async (comment) => {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== 'granted') return;
                      const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 });
                      if (!r.canceled) {
                        setSuggestionPhotos([r.assets[0].uri]);
                        setSuggestionComment(comment || 'Revisión recomendada');
                        await uploadSuggestion(item);
                      }
                    }},
                  ], 'plain-text');
                }}><Text style={styles.actionIcon}>📌</Text></TouchableOpacity>
                {item.status !== 'Listo' && (
                  <TouchableOpacity onPress={() => {
                    const ord = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo'];
                    const idx = ord.indexOf(item.status);
                    const next = ord[Math.min(idx + 1, 4)];
                    if (next !== item.status) updateProgress(item.id, next);
                    else Alert.alert('Info', 'Último paso.');
                  }}><Text style={styles.actionIcon}>▶️</Text></TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
                {/* MODAL PENDIENTES */}
        <Modal visible={showPendingModal} animationType="slide" transparent onRequestClose={() => setShowPendingModal(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, themeStyles.card]}>
              <Text style={[styles.modalTitle, themeStyles.text]}>📅 Solicitudes</Text>
              <FlatList
                data={pendingAppointments}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item }) => (
                  <View style={[styles.pendingItem, themeStyles.card]}>
                    <Text style={[styles.pendingName, themeStyles.text]}>{item.clientName}</Text>
                    <Text style={[styles.pendingPlate, themeStyles.subText]}>🚗 {item.plate}</Text>
                    <Text style={[styles.pendingService, themeStyles.text]}>{item.serviceType}</Text>
                    <Text style={[styles.pendingDateTime, themeStyles.subText]}>📅 {item.date} - ⏰ {item.time}</Text>
                    {item.comment && <Text style={[styles.pendingComment, themeStyles.subText]}>📝 {item.comment}</Text>}
                    <View style={styles.pendingActions}>
                      <TouchableOpacity style={[styles.pendingBtn, styles.pendingApprove]} onPress={() => approveAppointment(item.id)}>
                        <Text style={styles.pendingBtnText}>✅ Aprobar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.pendingBtn, styles.pendingReject]} onPress={() => rejectAppointment(item.id)}>
                        <Text style={styles.pendingBtnText}>❌ Rechazar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnClose]} onPress={() => setShowPendingModal(false)}>
                <Text style={styles.modalBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL HISTORIAL */}
        <Modal visible={historyModal} animationType="slide" transparent onRequestClose={() => setHistoryModal(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, themeStyles.card]}>
              <Text style={[styles.modalTitle, themeStyles.text]}>📜 Historial</Text>
              <FlatList
                data={vehicleHistory}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item }) => (
                  <View style={[styles.historyItem, themeStyles.card]}>
                    <Text style={[styles.historyDate, themeStyles.subText]}>{item.completedAt?.toDate ? new Date(item.completedAt.toDate()).toLocaleString() : 'Sin fecha'}</Text>
                    <Text style={[styles.historyText, themeStyles.text]}>🚗 {item.plate}</Text>
                    <Text style={[styles.historyText, themeStyles.subText]}>Estado previo: {item.previousStatus}</Text>
                    <Text style={[styles.historyText, themeStyles.text]}>Visita #{item.visitNumber || 1}</Text>
                  </View>
                )}
              />
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnClose]} onPress={() => setHistoryModal(false)}>
                <Text style={styles.modalBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL COTIZAR */}
        <Modal visible={showQuoteModal} animationType="slide" transparent onRequestClose={() => setShowQuoteModal(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, themeStyles.card]}>
              <Text style={[styles.modalTitle, themeStyles.text]}>💰 Cotización para {selectedQuoteVehicle?.name}</Text>
              <Text style={[styles.modalLabel, themeStyles.text]}>Detalle:</Text>
              <TextInput
                style={[styles.input, themeStyles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder={"Ej:\nCambio aceite: $45\nPastillas: $80\nMano de obra: $30"}
                value={quoteText} onChangeText={setQuoteText} multiline
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
              />
              <Text style={[styles.modalLabel, themeStyles.text]}>Comentario (opcional):</Text>
              <TextInput style={[styles.input, themeStyles.input]} placeholder="Notas" value={quoteComment} onChangeText={setQuoteComment} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
              <Text style={[styles.modalLabel, themeStyles.text]}>Fotos ({quotePhotos.length}/5):</Text>
              <ScrollView horizontal style={{ marginVertical: 10 }}>
                {quotePhotos.map((uri, i) => <Image key={i} source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: 6 }} />)}
              </ScrollView>
              <TouchableOpacity style={styles.photoBtn} onPress={takeQuotePhoto}>
                <Text style={styles.photoBtnText}>📸 Tomar foto</Text>
              </TouchableOpacity>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => { setShowQuoteModal(false); setQuoteText(''); setQuoteComment(''); setQuotePhotos([]); setSelectedQuoteVehicle(null); }}>
                  <Text style={styles.modalBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={sendQuote}>
                  <Text style={styles.modalBtnText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL LISTA COTIZACIONES */}
        <Modal visible={showQuotesListModal} animationType="slide" transparent onRequestClose={() => setShowQuotesListModal(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, themeStyles.card]}>
              <Text style={[styles.modalTitle, themeStyles.text]}>💰 Todas las cotizaciones</Text>
              <FlatList
                data={quotes}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item }) => (
                  <View style={[styles.suggestionItem, themeStyles.card]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.suggestionComment, themeStyles.text, { fontWeight: 'bold' }]}>{item.clientName} - {item.plate}</Text>
                      <View style={[styles.badgeSmall, { backgroundColor:
                        item.status === 'approved' ? '#2ECC71' :
                        item.status === 'rejected' ? '#E53E3E' :
                        item.viewedByClient ? '#3498DB' : '#F39C12'
                      }]}>
                        <Text style={styles.badgeTextSmall}>
                          {item.status === 'approved' ? '🟢 Aprobada' :
                           item.status === 'rejected' ? '🔴 Rechazada' :
                           item.viewedByClient ? '🔵 Vista' : '🟡 Enviada'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.suggestionComment, themeStyles.subText, { marginTop: 6 }]} numberOfLines={3}>{item.text}</Text>
                    {item.status === 'rejected' && item.rejectionReason && (
                      <Text style={{ color: '#E53E3E', fontStyle: 'italic', marginTop: 4 }}>Motivo: {item.rejectionReason}</Text>
                    )}
                    <TouchableOpacity
                      style={{ backgroundColor: '#E53E3E', padding: 8, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' }}
                      onPress={() => Alert.alert('Eliminar', '¿Eliminar cotización?', [
                        { text: 'No' },
                        { text: 'Sí', onPress: () => deleteDoc(doc(db, 'quotes', item.id)), style: 'destructive' },
                      ])}
                    >
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>🗑️ Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnClose]} onPress={() => setShowQuotesListModal(false)}>
                <Text style={styles.modalBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL PROMOCIONES */}
        <Modal visible={showPromotionModal} animationType="slide" transparent onRequestClose={() => setShowPromotionModal(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, themeStyles.card]}>
              <Text style={[styles.modalTitle, themeStyles.text]}>📢 Promoción</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={[styles.label, themeStyles.text]}>Activar</Text>
                <Switch value={tempPromotionActive} onValueChange={setTempPromotionActive} trackColor={{ false: '#767577', true: '#2ECC71' }} thumbColor="#FFF" />
              </View>
              <Text style={[styles.label, themeStyles.text]}>Mensaje:</Text>
              <TextInput style={[styles.input, themeStyles.input]} placeholder="Ej: 10% descuento en mantenimiento" value={tempPromotionMessage} onChangeText={setTempPromotionMessage} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
              <Text style={[styles.label, themeStyles.text]}>Válido hasta:</Text>
              <TextInput style={[styles.input, themeStyles.input]} placeholder="Ej: 31 de agosto" value={tempPromotionExpires} onChangeText={setTempPromotionExpires} placeholderTextColor={isDarkMode ? '#888' : '#999'} />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowPromotionModal(false)}>
                  <Text style={styles.modalBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={savePromotion}>
                  <Text style={styles.modalBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return null;
}
// ------------------------------------------------------------
// UTILIDADES
// ------------------------------------------------------------
const getStatusColor = (s) => ({
  'Recibido': '#F39C12',
  'Diagnóstico': '#3498DB',
  'Reparación': '#3182CE',
  'Pruebas': '#805AD5',
  'Listo': '#2ECC71'
}[s] || '#A0AEC0');

const getAppointmentColor = (s) => ({
  'pending': '#F39C12',
  'confirmed': '#2ECC71',
  'rejected': '#E53E3E',
  'cancelled': '#A0AEC0'
}[s] || '#A0AEC0');

const getMaintenanceStatusColor = (s) => ({
  'al_dia': '#2ECC71',
  'proximo': '#F39C12',
  'vencido': '#E53E3E'
}[s] || '#2ECC71');

const getStatusEmoji = (s) => ({
  'Recibido': '🟡',
  'Diagnóstico': '🔵',
  'Reparación': '🔧',
  'Pruebas': '🧪',
  'Listo': '✅'
}[s] || '📌');

const getThemeStyles = (isDark) => ({
  background: { backgroundColor: isDark ? '#1A202C' : '#F4F6F9' },
  card: { backgroundColor: isDark ? '#2D3748' : '#FFFFFF' },
  text: { color: isDark ? '#FFFFFF' : '#1A365D' },
  subText: { color: isDark ? '#A0AEC0' : '#4A5568' },
  input: {
    backgroundColor: isDark ? '#2D3748' : '#FFFFFF',
    borderColor: isDark ? '#4A5568' : '#E2E8F0',
    color: isDark ? '#FFFFFF' : '#333333',
  },
  link: { color: isDark ? '#63B3ED' : '#2B6CB0' },
});
// ------------------------------------------------------------
// ESTILOS
// ------------------------------------------------------------
const styles = StyleSheet.create({
  // Generales
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingHorizontal: 15 },

  // Welcome
  welcomeContainer: { justifyContent: 'center', alignItems: 'center' },
  welcomeBox: { padding: 30, borderRadius: 30, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  welcomeButtons: { width: '100%', marginTop: 20 },
  welcomeBtn: { backgroundColor: '#2B6CB0', padding: 14, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  welcomeBtnAdmin: { backgroundColor: '#1A365D' },
  welcomeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Login
  loginContainer: { justifyContent: 'center', alignItems: 'center' },
  loginBox: { padding: 30, borderRadius: 30, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  logo: { fontSize: 40, fontWeight: 'bold' },
  slogan: { fontSize: 16, marginBottom: 25 },
  backText: { marginTop: 10, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16, width: '100%' },
  loginBtn: { backgroundColor: '#2B6CB0', padding: 15, borderRadius: 15, width: '100%', alignItems: 'center', marginTop: 15 },
  loginBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },

  // Header
  header: { fontSize: 24, fontWeight: 'bold' },
  clientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  greeting: { fontSize: 16, marginTop: 2 },
  backBtn: { fontWeight: 'bold', fontSize: 16 },

  // Promociones
  promoBanner: { flexDirection: 'row', backgroundColor: '#FFF5E6', borderRadius: 16, padding: 16, marginHorizontal: 16, marginVertical: 8, borderWidth: 1, borderColor: '#F6AD55', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  promoEmoji: { fontSize: 32, marginRight: 12 },
  promoContent: { flex: 1 },
  promoTitle: { fontSize: 12, fontWeight: 'bold', color: '#DD6B20' },
  promoMessage: { fontSize: 16, fontWeight: 'bold', color: '#1A202C' },
  promoExpires: { fontSize: 12, color: '#4A5568', marginTop: 2 },

  // Carrusel
  carousel: { marginVertical: 10, maxHeight: 180 },
  carouselCard: { padding: 10, borderRadius: 15, marginRight: 12, alignItems: 'center', width: 110, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  carouselCardSelected: { borderWidth: 3, borderColor: '#2B6CB0' },
  carouselImg: { width: 70, height: 70, borderRadius: 10, marginBottom: 5 },
  carouselPlaceholder: { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  carouselPlate: { fontWeight: 'bold', fontSize: 14 },
  badgeSmall: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
  badgeTextSmall: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  loyaltyBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#F6AD55', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  loyaltyBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // Botón agregar vehículo
  addVehicleBtn: { backgroundColor: '#EDF2F7', padding: 10, borderRadius: 12, alignItems: 'center', marginHorizontal: 16, marginBottom: 6, borderWidth: 2, borderColor: '#CBD5E0', borderStyle: 'dashed' },
  addVehicleBtnText: { color: '#2B6CB0', fontWeight: 'bold', fontSize: 14 },

  // Tarjeta del cliente
  clientCardContainer: { padding: 20, borderRadius: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginTop: 10 },
  clientCardContent: { alignItems: 'center', paddingBottom: 120 },
  clientImg: { width: 160, height: 160, borderRadius: 20, marginBottom: 15 },
  clientPlaceholder: { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  clientName: { fontSize: 22, fontWeight: 'bold' },
  clientPlate: { fontSize: 18, marginBottom: 10 },

  // Saldo
  balanceContainer: { marginVertical: 8, alignItems: 'center' },
  balanceText: { fontSize: 18, fontWeight: 'bold' },
  balancePositive: { color: '#2ECC71' },
  balanceNegative: { color: '#E53E3E' },
  balanceZero: { color: '#A0AEC0' },

  // Progress (stepper)
  progressContainer: { width: '100%', marginVertical: 15 },
  progressSteps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressStepItem: { alignItems: 'center', flex: 1 },
  progressCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' },
  progressCircleActive: { backgroundColor: '#2B6CB0' },
  progressCircleText: { fontSize: 12, fontWeight: 'bold', color: '#4A5568' },
  progressStepLabel: { fontSize: 9, marginTop: 4, color: '#4A5568', textAlign: 'center' },
  progressStepLabelActive: { color: '#2B6CB0', fontWeight: 'bold' },
  progressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginVertical: 5 },
  progressBarFill: { height: '100%', backgroundColor: '#2B6CB0', borderRadius: 3 },
  progressPercent: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 4 },
    // Mantenimiento
  maintenanceCard: { width: '100%', padding: 12, borderRadius: 10, marginVertical: 8, borderLeftWidth: 4, backgroundColor: '#F0FFF4' },
  maintenanceLabel: { fontSize: 14, fontWeight: '600' },
  maintenanceKm: { fontSize: 20, fontWeight: 'bold' },

  // WhatsApp
  whatsappBtn: { backgroundColor: '#25D366', padding: 12, borderRadius: 30, width: '100%', alignItems: 'center', marginVertical: 10 },
  whatsappBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Botones de acción
  actionButtons: { paddingVertical: 10 },
  actionBtn: { padding: 14, borderRadius: 16, marginBottom: 10, alignItems: 'center' },
  primaryBtn: { backgroundColor: '#2B6CB0' },
  outlineBtn: { borderWidth: 2, borderColor: '#2B6CB0' },
  suggestionBtn: { backgroundColor: '#ED8936' },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  actionBtnOutlineText: { fontWeight: 'bold', fontSize: 16 },

  // Not found
  notFoundCard: { alignItems: 'center', marginTop: 60 },
  notFound: { fontSize: 20, fontWeight: 'bold' },
  retryBtn: { backgroundColor: '#2B6CB0', padding: 12, borderRadius: 12, marginTop: 20 },
  retryBtnText: { color: '#FFF', fontWeight: 'bold' },

  // Modales
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '95%', maxHeight: '85%', padding: 16, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalLabel: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  modalBtn: { padding: 12, borderRadius: 12, flex: 1, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#E53E3E', marginRight: 8 },
  modalBtnConfirm: { backgroundColor: '#2B6CB0', marginLeft: 8 },
  modalBtnClose: { backgroundColor: '#2B6CB0', marginTop: 10 },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Schedule (agendar cita)
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  backButton: { marginRight: 12 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  scheduleContent: { paddingBottom: 40 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 8 },
  serviceItemGrid: { width: '30%', marginBottom: 10, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E0' },
  serviceItemSelected: { borderWidth: 2, borderColor: '#2B6CB0', backgroundColor: '#EBF4FF' },
  serviceIcon: { fontSize: 28 },
  serviceLabel: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  dateOption: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent', marginRight: 8 },
  dateOptionSelected: { borderColor: '#2B6CB0' },
  dateOptionText: { fontSize: 14 },
  timeOption: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent', marginLeft: 8 },
  timeOptionSelected: { borderColor: '#2B6CB0' },
  timeOptionText: { fontSize: 14 },

  // Citas
  appointmentItem: { padding: 12, borderRadius: 12, marginBottom: 8 },
  appointmentService: { fontSize: 16, fontWeight: 'bold' },
  appointmentDetails: { fontSize: 14, marginTop: 2 },
  appointmentStatus: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  appointmentStatusText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  cancelAppointmentBtn: { backgroundColor: '#E53E3E', padding: 8, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  cancelAppointmentBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // Sugerencias
  suggestionItem: { padding: 12, borderRadius: 12, marginBottom: 8 },
  suggestionComment: { fontSize: 14, marginBottom: 6 },
  suggestionPhoto: { width: 80, height: 80, borderRadius: 8, marginRight: 6 },
  suggestionAttendBtn: { backgroundColor: '#2B6CB0', padding: 8, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  suggestionAttendBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // Admin
  adminHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  adminControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logout: { fontWeight: 'bold', fontSize: 14 },
  pendingBadge: { backgroundColor: '#F39C12', padding: 10, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  pendingBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  quickSearchContainer: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  quickSearchInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  quickSearchBtn: { backgroundColor: '#2B6CB0', paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
  quickSearchBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  promoBtn: { backgroundColor: '#ED8936', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12 },
  promoBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

  // Formulario admin
  form: { marginBottom: 8 },
  formContent: { padding: 15, borderRadius: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  label: { fontWeight: '600', marginBottom: 5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, marginHorizontal: 3, flex: 1, alignItems: 'center', minWidth: 60 },
  statusBtnText: { fontWeight: 'bold', fontSize: 11 },
  kmButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginVertical: 6 },
  kmBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#EDF2F7', borderWidth: 1, borderColor: '#E2E8F0' },
  kmBtnSelected: { backgroundColor: '#2B6CB0', borderColor: '#2B6CB0' },
  kmBtnText: { fontSize: 12, fontWeight: '600', color: '#4A5568' },
  kmBtnTextSelected: { color: '#FFF' },
  photoBtn: { backgroundColor: '#EDF2F7', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  photoBtnText: { color: '#2D3748', fontWeight: '600' },
  preview: { width: '100%', height: 150, borderRadius: 10, marginBottom: 10 },
  saveBtn: { backgroundColor: '#2B6CB0', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  cancel: { textAlign: 'center', marginTop: 10, fontWeight: '600' },

  // Búsqueda y filtros
  searchSection: { paddingBottom: 8, marginTop: 4 },
  searchInput: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 2, fontSize: 16, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#EDF2F7', borderWidth: 1, borderColor: '#CBD5E0' },
  filterChipActive: { backgroundColor: '#2B6CB0', borderColor: '#2B6CB0' },
  filterChipText: { fontSize: 11, color: '#4A5568' },
  filterChipTextActive: { color: '#FFF' },
  sortRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  sortLabel: { fontSize: 13, fontWeight: '600' },
  sortChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: '#EDF2F7', marginRight: 4 },
  sortChipActive: { backgroundColor: '#2B6CB0' },
  sortChipText: { fontSize: 11, color: '#4A5568' },
  sortChipTextActive: { color: '#FFF' },
  debtTotalContainer: { backgroundColor: '#FDE8E8', padding: 10, borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: '#E53E3E' },
  debtTotalText: { color: '#C53030', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  debtText: { color: '#E53E3E', fontWeight: 'bold', fontSize: 14 },
  phoneText: { fontSize: 13, fontWeight: '500' },

  // Lista de vehículos
  listTitle: { fontSize: 18, fontWeight: 'bold', paddingVertical: 8 },
  list: { flex: 1 },
  vehicleCard: { flexDirection: 'row', borderRadius: 15, padding: 12, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  vehicleImg: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  cardPlaceholder: { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: 'bold' },
  vehiclePlate: { fontSize: 14 },
  vehicleMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusBadgeSmallText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  vehicleMetaText: { fontSize: 11, color: '#4A5568' },
  vehicleActions: { flexDirection: 'row', gap: 6 },
  actionIcon: { fontSize: 18 },

  // Pendientes
  pendingItem: { padding: 12, borderRadius: 12, marginBottom: 8 },
  pendingName: { fontSize: 16, fontWeight: 'bold' },
  pendingPlate: { fontSize: 14, marginTop: 2 },
  pendingService: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  pendingDateTime: { fontSize: 13, marginTop: 2 },
  pendingComment: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  pendingActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  pendingBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  pendingApprove: { backgroundColor: '#2ECC71', marginRight: 4 },
  pendingReject: { backgroundColor: '#E53E3E', marginLeft: 4 },
  pendingBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // Historial
  historyItem: { padding: 12, borderRadius: 12, marginBottom: 8 },
  historyDate: { fontSize: 12, fontWeight: 'bold' },
  historyText: { fontSize: 14, marginTop: 2 },

  // Nota final
  note: { marginTop: 10, fontStyle: 'italic', textAlign: 'center' },
});

export default App;