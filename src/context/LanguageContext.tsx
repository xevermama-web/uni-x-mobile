import React, { createContext, useContext, useEffect, useState } from 'react';

export type LanguageCode = 'en' | 'bn' | 'es' | 'fr' | 'ar';

export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    students: 'Students & Alumni',
    chat: 'Group Chat',
    routines: 'Routines & Class',
    noticeBoard: 'Notice Board',
    materials: 'Course Materials',
    settings: 'Settings',
    studyGroups: 'Study Groups & Course Chat',
    createGroup: 'Create Study Group',
    searchGroups: 'Search groups, courses, batches...',
    noGroupsFound: 'No study groups found',
    groupInfo: 'Group Info',
    aboutGroup: 'About Group',
    groupMembers: 'Group Members',
    deleteGroup: 'Delete Chat Group',
    viewFiles: 'View Files',
    messageRetention: 'Message Auto-Disappearing',
    typeMessage: 'Type your message...',
    send: 'Send',
    save: 'Save',
    cancel: 'Cancel',
    appearance: 'Appearance & Theme',
    languageRegion: 'Language & Region',
    accentColor: 'Theme Accent Color',
    themeMode: 'Theme Mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    systemDefault: 'System Default',
    languageSet: 'Language updated successfully',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    students: 'শিক্ষার্থী ও অ্যালুমনি',
    chat: 'গ্রুপ চ্যাট',
    routines: 'ক্লাস রুটিন',
    noticeBoard: 'নোটিশ বোর্ড',
    materials: 'কোর্স মেটেরিয়ালস',
    settings: 'সেটিংস',
    studyGroups: 'স্টাডি গ্রুপ ও কোর্স চ্যাট',
    createGroup: 'স্টাডি গ্রুপ তৈরি করুন',
    searchGroups: 'গ্রুপ, কোর্স বা ব্যাচ খুঁজুন...',
    noGroupsFound: 'কোনো স্টাডি গ্রুপ পাওয়া যায়নি',
    groupInfo: 'গ্রুপের তথ্য',
    aboutGroup: 'গ্রুপ সম্পর্কে',
    groupMembers: 'গ্রুপের সদস্যবৃন্দ',
    deleteGroup: 'চ্যাট গ্রুপ মুছে ফেলুন',
    viewFiles: 'ফাইল দেখুন',
    messageRetention: 'স্বয়ংক্রিয় বার্তা মোছা',
    typeMessage: 'আপনার বার্তা লিখুন...',
    send: 'পাঠান',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    appearance: 'চেহারা এবং থিম',
    languageRegion: 'ভাষা ও অঞ্চল',
    accentColor: 'থিম অ্যাকসেন্ট রঙ',
    themeMode: 'থিম মোড',
    lightMode: 'লাইট মোড',
    darkMode: 'ডার্ক মোড',
    systemDefault: 'সিস্টেম ডিফল্ট',
    languageSet: 'ভাষা সফলভাবে আপডেট হয়েছে',
  },
  es: {
    dashboard: 'Panel Principal',
    students: 'Estudiantes y Exalumnos',
    chat: 'Chat de Grupo',
    routines: 'Horarios y Clases',
    noticeBoard: 'Tablón de Anuncios',
    materials: 'Materiales del Curso',
    settings: 'Configuración',
    studyGroups: 'Grupos de Estudio y Chat',
    createGroup: 'Crear Grupo de Estudio',
    searchGroups: 'Buscar grupos, cursos, promociones...',
    noGroupsFound: 'No se encontraron grupos de estudio',
    groupInfo: 'Información del Grupo',
    aboutGroup: 'Acerca del Grupo',
    groupMembers: 'Miembros del Grupo',
    deleteGroup: 'Eliminar Grupo de Chat',
    viewFiles: 'Ver Archivos',
    messageRetention: 'Eliminación Automática de Mensajes',
    typeMessage: 'Escribe tu mensaje...',
    send: 'Enviar',
    save: 'Guardar',
    cancel: 'Cancelar',
    appearance: 'Apariencia y Tema',
    languageRegion: 'Idioma y Región',
    accentColor: 'Color del Tema',
    themeMode: 'Modo del Tema',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    systemDefault: 'Predeterminado del Sistema',
    languageSet: 'Idioma actualizado correctamente',
  },
  fr: {
    dashboard: 'Tableau de bord',
    students: 'Étudiants et Anciens',
    chat: 'Discussion de groupe',
    routines: 'Emploi du temps',
    noticeBoard: 'Panneau d\'affichage',
    materials: 'Supports de cours',
    settings: 'Paramètres',
    studyGroups: 'Groupes d\'étude et discussion',
    createGroup: 'Créer un groupe d\'étude',
    searchGroups: 'Rechercher des groupes, cours...',
    noGroupsFound: 'Aucun groupe d\'étude trouvé',
    groupInfo: 'Infos sur le groupe',
    aboutGroup: 'À propos du groupe',
    groupMembers: 'Membres du groupe',
    deleteGroup: 'Supprimer le groupe',
    viewFiles: 'Voir los fichiers',
    messageRetention: 'Incinération automatique des messages',
    typeMessage: 'Saisissez votre message...',
    send: 'Envoyer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    appearance: 'Apparence et Thème',
    languageRegion: 'Langue et Région',
    accentColor: 'Couleur d\'accentuation',
    themeMode: 'Mode Thème',
    lightMode: 'Mode Clair',
    darkMode: 'Mode Sombre',
    systemDefault: 'Par défaut',
    languageSet: 'Langue mise à jour avec succès',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    students: 'الطلاب والخريجون',
    chat: 'دردشة الجماعة',
    routines: 'الجداول والجلسات',
    noticeBoard: 'لوحة الإعلانات',
    materials: 'المواد الدراسية',
    settings: 'الإعدادات',
    studyGroups: 'مجموعات الدراسة والدردشة',
    createGroup: 'إنشاء مجموعة دراسية',
    searchGroups: 'البحث عن المجموعات، الدورات...',
    noGroupsFound: 'لم يتم العثور على مجموعات دراسية',
    groupInfo: 'معلومات المجموعة',
    aboutGroup: 'عن المجموعة',
    groupMembers: 'أعضاء المجموعة',
    deleteGroup: 'حذف مجموعة الدردشة',
    viewFiles: 'عرض الملفات',
    messageRetention: 'الحذف التلقائي للرسائل',
    typeMessage: 'اكتب رسالتك...',
    send: 'إرسال',
    save: 'حفظ',
    cancel: 'إلغاء',
    appearance: 'المظهر والسمة',
    languageRegion: 'اللغة والمنطقة',
    accentColor: 'لون السمة',
    themeMode: 'وضع السمة',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    systemDefault: 'افتراضي النظام',
    languageSet: 'تم تحديث اللغة بنجاح',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('unixx_language') as LanguageCode | null;
    return saved && ['en', 'bn', 'es', 'fr', 'ar'].includes(saved) ? saved : 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('unixx_language', lang);
  };

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', dir);
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || fallback || translations.en[key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
