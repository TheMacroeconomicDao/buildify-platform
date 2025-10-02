import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {parsePhoneNumber, isValidPhoneNumber} from 'libphonenumber-js';
import {useTranslation} from 'react-i18next';
import styles from '../styles';
import Text from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Максимальные длины номеров телефонов для разных стран (без кода страны)
const countryPhoneLengths = {
  1: 10, // США, Канада
  7: 10, // Россия, Казахстан
  20: 10, // Египет
  27: 9, // ЮАР
  30: 10, // Греция
  31: 9, // Нидерланды
  32: 9, // Бельгия
  33: 10, // Франция
  34: 9, // Испания
  36: 9, // Венгрия
  39: 10, // Италия
  40: 10, // Румыния
  41: 9, // Швейцария
  43: 11, // Австрия
  44: 10, // Великобритания
  45: 8, // Дания
  46: 9, // Швеция
  47: 8, // Норвегия
  48: 9, // Польша
  49: 11, // Германия
  51: 9, // Перу
  52: 10, // Мексика
  53: 8, // Куба
  54: 10, // Аргентина
  55: 11, // Бразилия
  56: 9, // Чили
  57: 10, // Колумбия
  58: 10, // Венесуэла
  60: 10, // Малайзия
  61: 9, // Австралия
  62: 11, // Индонезия
  63: 10, // Филиппины
  64: 9, // Новая Зеландия
  65: 8, // Сингапур
  66: 9, // Таиланд
  81: 10, // Япония
  82: 10, // Южная Корея
  84: 9, // Вьетнам
  86: 11, // Китай
  90: 10, // Турция
  91: 10, // Индия
  92: 10, // Пакистан
  93: 9, // Афганистан
  94: 9, // Шри-Ланка
  95: 9, // Мьянма
  98: 10, // Иран
  212: 9, // Марокко
  213: 9, // Алжир
  216: 8, // Тунис
  218: 9, // Ливия
  220: 7, // Гамбия
  221: 9, // Сенегал
  222: 8, // Мавритания
  223: 8, // Мали
  224: 9, // Гвинея
  225: 10, // Кот-д'Ивуар
  226: 8, // Буркина-Фасо
  227: 8, // Нигер
  228: 8, // Того
  229: 8, // Бенин
  230: 7, // Маврикий
  231: 8, // Либерия
  232: 8, // Сьерра-Леоне
  233: 9, // Гана
  234: 10, // Нигерия
  235: 8, // Чад
  236: 8, // ЦАР
  237: 9, // Камерун
  238: 7, // Кабо-Верде
  239: 7, // Сан-Томе и Принсипи
  240: 9, // Экваториальная Гвинея
  241: 8, // Габон
  242: 9, // Конго
  243: 9, // ДР Конго
  244: 9, // Ангола
  245: 7, // Гвинея-Бисау
  246: 7, // Британские территории в Индийском океане
  248: 7, // Сейшелы
  249: 9, // Судан
  250: 9, // Руанда
  251: 9, // Эфиопия
  252: 8, // Сомали
  253: 8, // Джибути
  254: 9, // Кения
  255: 9, // Танзания
  256: 9, // Уганда
  257: 8, // Бурунди
  258: 9, // Мозамбик
  260: 9, // Замбия
  261: 9, // Мадагаскар
  262: 9, // Реюньон, Майотта
  263: 9, // Зимбабве
  264: 9, // Намибия
  265: 9, // Малави
  266: 8, // Лесото
  267: 8, // Ботсвана
  268: 8, // Эсватини
  269: 7, // Коморы
  290: 4, // Остров Святой Елены
  291: 7, // Эритрея
  297: 7, // Аруба
  298: 6, // Фарерские острова
  299: 6, // Гренландия
  350: 8, // Гибралтар
  351: 9, // Португалия
  352: 9, // Люксембург
  353: 9, // Ирландия
  354: 7, // Исландия
  355: 9, // Албания
  356: 8, // Мальта
  357: 8, // Кипр
  358: 9, // Финляндия
  359: 9, // Болгария
  370: 8, // Литва
  371: 8, // Латвия
  372: 8, // Эстония
  373: 8, // Молдова
  374: 8, // Армения
  375: 9, // Беларусь
  376: 6, // Андорра
  377: 8, // Монако
  378: 10, // Сан-Марино
  380: 9, // Украина
  381: 9, // Сербия
  382: 8, // Черногория
  383: 8, // Косово
  385: 9, // Хорватия
  386: 8, // Словения
  387: 8, // Босния и Герцеговина
  389: 8, // Северная Македония
  420: 9, // Чехия
  421: 9, // Словакия
  423: 7, // Лихтенштейн
  500: 5, // Фолклендские острова
  501: 7, // Белиз
  502: 8, // Гватемала
  503: 8, // Сальвадор
  504: 8, // Гондурас
  505: 8, // Никарагуа
  506: 8, // Коста-Рика
  507: 8, // Панама
  508: 6, // Сен-Пьер и Микелон
  509: 8, // Гаити
  590: 9, // Гваделупа, Сен-Бартелеми, Сен-Мартен
  591: 8, // Боливия
  592: 7, // Гайана
  593: 9, // Эквадор
  594: 9, // Французская Гвиана
  595: 9, // Парагвай
  596: 9, // Мартиника
  597: 7, // Суринам
  598: 8, // Уругвай
  599: 7, // Кюрасао, Бонэйр
  670: 8, // Восточный Тимор
  672: 6, // Антарктида
  673: 7, // Бруней
  674: 7, // Науру
  675: 8, // Папуа-Новая Гвинея
  676: 5, // Тонга
  677: 7, // Соломоновы Острова
  678: 7, // Вануату
  679: 7, // Фиджи
  680: 7, // Палау
  681: 6, // Уоллис и Футуна
  682: 5, // Острова Кука
  683: 4, // Ниуэ
  684: 7, // Американское Самоа
  685: 7, // Самоа
  686: 8, // Кирибати
  687: 6, // Новая Каледония
  688: 6, // Тувалу
  689: 8, // Французская Полинезия
  690: 4, // Токелау
  691: 7, // Федеративные Штаты Микронезии
  692: 7, // Маршалловы Острова
  850: 10, // Северная Корея
  852: 8, // Гонконг
  853: 8, // Макао
  855: 9, // Камбоджа
  856: 10, // Лаос
  880: 10, // Бангладеш
  886: 9, // Тайвань
  960: 7, // Мальдивы
  961: 8, // Ливан
  962: 9, // Иордания
  963: 9, // Сирия
  964: 10, // Ирак
  965: 8, // Кувейт
  966: 9, // Саудовская Аравия
  967: 9, // Йемен
  968: 8, // Оман
  970: 9, // Палестина
  971: 9, // ОАЭ
  972: 9, // Израиль
  973: 8, // Бахрейн
  974: 8, // Катар
  975: 8, // Бутан
  976: 8, // Монголия
  977: 10, // Непал
  992: 9, // Таджикистан
  993: 8, // Туркменистан
  994: 9, // Азербайджан
  995: 9, // Грузия
  996: 9, // Кыргызстан
  998: 9, // Узбекистан
};

// Коды стран для автоматического распознавания (вынесены за компонент как статичные данные)
const countryCodes = {
  1: 'US',
  7: ['RU', 'KZ'],
  20: 'EG',
  27: 'ZA',
  30: 'GR',
  31: 'NL',
  32: 'BE',
  33: 'FR',
  34: 'ES',
  36: 'HU',
  39: 'IT',
  40: 'RO',
  41: 'CH',
  43: 'AT',
  44: 'GB',
  45: 'DK',
  46: 'SE',
  47: 'NO',
  48: 'PL',
  49: 'DE',
  51: 'PE',
  52: 'MX',
  53: 'CU',
  54: 'AR',
  55: 'BR',
  56: 'CL',
  57: 'CO',
  58: 'VE',
  60: 'MY',
  61: 'AU',
  62: 'ID',
  63: 'PH',
  64: 'NZ',
  65: 'SG',
  66: 'TH',
  81: 'JP',
  82: 'KR',
  84: 'VN',
  86: 'CN',
  90: 'TR',
  91: 'IN',
  92: 'PK',
  93: 'AF',
  94: 'LK',
  95: 'MM',
  98: 'IR',
  212: 'MA',
  213: 'DZ',
  216: 'TN',
  218: 'LY',
  220: 'GM',
  221: 'SN',
  222: 'MR',
  223: 'ML',
  224: 'GN',
  225: 'CI',
  226: 'BF',
  227: 'NE',
  228: 'TG',
  229: 'BJ',
  230: 'MU',
  231: 'LR',
  232: 'SL',
  233: 'GH',
  234: 'NG',
  235: 'TD',
  236: 'CF',
  237: 'CM',
  238: 'CV',
  239: 'ST',
  240: 'GQ',
  241: 'GA',
  242: 'CG',
  243: 'CD',
  244: 'AO',
  245: 'GW',
  246: 'IO',
  248: 'SC',
  249: 'SD',
  250: 'RW',
  251: 'ET',
  252: 'SO',
  253: 'DJ',
  254: 'KE',
  255: 'TZ',
  256: 'UG',
  257: 'BI',
  258: 'MZ',
  260: 'ZM',
  261: 'MG',
  262: ['RE', 'YT'],
  263: 'ZW',
  264: 'NA',
  265: 'MW',
  266: 'LS',
  267: 'BW',
  268: 'SZ',
  269: 'KM',
  290: 'SH',
  291: 'ER',
  297: 'AW',
  298: 'FO',
  299: 'GL',
  350: 'GI',
  351: 'PT',
  352: 'LU',
  353: 'IE',
  354: 'IS',
  355: 'AL',
  356: 'MT',
  357: 'CY',
  358: 'FI',
  359: 'BG',
  370: 'LT',
  371: 'LV',
  372: 'EE',
  373: 'MD',
  374: 'AM',
  375: 'BY',
  376: 'AD',
  377: 'MC',
  378: 'SM',
  380: 'UA',
  381: 'RS',
  382: 'ME',
  383: 'XK',
  385: 'HR',
  386: 'SI',
  387: 'BA',
  389: 'MK',
  420: 'CZ',
  421: 'SK',
  423: 'LI',
  500: 'FK',
  501: 'BZ',
  502: 'GT',
  503: 'SV',
  504: 'HN',
  505: 'NI',
  506: 'CR',
  507: 'PA',
  508: 'PM',
  509: 'HT',
  590: ['GP', 'BL', 'MF'],
  591: 'BO',
  592: 'GY',
  593: 'EC',
  594: 'GF',
  595: 'PY',
  596: 'MQ',
  597: 'SR',
  598: 'UY',
  599: ['CW', 'BQ'],
  670: 'TL',
  672: 'AQ',
  673: 'BN',
  674: 'NR',
  675: 'PG',
  676: 'TO',
  677: 'SB',
  678: 'VU',
  679: 'FJ',
  680: 'PW',
  681: 'WF',
  682: 'CK',
  683: 'NU',
  684: 'AS',
  685: 'WS',
  686: 'KI',
  687: 'NC',
  688: 'TV',
  689: 'PF',
  690: 'TK',
  691: 'FM',
  692: 'MH',
  850: 'KP',
  852: 'HK',
  853: 'MO',
  855: 'KH',
  856: 'LA',
  880: 'BD',
  886: 'TW',
  960: 'MV',
  961: 'LB',
  962: 'JO',
  963: 'SY',
  964: 'IQ',
  965: 'KW',
  966: 'SA',
  967: 'YE',
  968: 'OM',
  970: 'PS',
  971: 'AE', // ОАЭ
  972: 'IL',
  973: 'BH',
  974: 'QA',
  975: 'BT',
  976: 'MN',
  977: 'NP',
  992: 'TJ',
  993: 'TM',
  994: 'AZ',
  995: 'GE',
  996: 'KG',
  998: 'UZ',
};

// Список популярных стран с их кодами и названиями
const getCountriesList = t => [
  {code: '971', countryCode: 'AE', name: t('United Arab Emirates')},
  {code: '966', countryCode: 'SA', name: t('Saudi Arabia')},
  {code: '974', countryCode: 'QA', name: t('Qatar')},
  {code: '965', countryCode: 'KW', name: t('Kuwait')},
  {code: '968', countryCode: 'OM', name: t('Oman')},
  {code: '973', countryCode: 'BH', name: t('Bahrain')},
  {code: '1', countryCode: 'US', name: t('United States')},
  {code: '7', countryCode: 'RU', name: t('Russia')},
  {code: '44', countryCode: 'GB', name: t('United Kingdom')},
  {code: '49', countryCode: 'DE', name: t('Germany')},
  {code: '33', countryCode: 'FR', name: t('France')},
  {code: '39', countryCode: 'IT', name: t('Italy')},
  {code: '34', countryCode: 'ES', name: t('Spain')},
  {code: '20', countryCode: 'EG', name: t('Egypt')},
  {code: '90', countryCode: 'TR', name: t('Turkey')},
  {code: '91', countryCode: 'IN', name: t('India')},
  {code: '86', countryCode: 'CN', name: t('China')},
  {code: '81', countryCode: 'JP', name: t('Japan')},
  {code: '82', countryCode: 'KR', name: t('South Korea')},
  {code: '61', countryCode: 'AU', name: t('Australia')},
  {code: '55', countryCode: 'BR', name: t('Brazil')},
  {code: '52', countryCode: 'MX', name: t('Mexico')},
  {code: '31', countryCode: 'NL', name: t('Netherlands')},
  {code: '48', countryCode: 'PL', name: t('Poland')},
  {code: '380', countryCode: 'UA', name: t('Ukraine')},
  {code: '972', countryCode: 'IL', name: t('Israel')},
  {code: '962', countryCode: 'JO', name: t('Jordan')},
  {code: '961', countryCode: 'LB', name: t('Lebanon')},
  {code: '963', countryCode: 'SY', name: t('Syria')},
  {code: '964', countryCode: 'IQ', name: t('Iraq')},
  {code: '98', countryCode: 'IR', name: t('Iran')},
  {code: '92', countryCode: 'PK', name: t('Pakistan')},
  {code: '880', countryCode: 'BD', name: t('Bangladesh')},
  {code: '93', countryCode: 'AF', name: t('Afghanistan')},
];

const StandardPhoneInput = ({
  value = '',
  onChange = () => {},
  placeholder = '',
  size = 'md',
  error = null,
  disabled = false,
  width = '100%',
}) => {
  const {t} = useTranslation();
  const [inputValue, setInputValue] = useState(value || '+971 ');
  const [_, setDetectedCountry] = useState('AE');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Получаем список стран с переводами
  const countriesList = getCountriesList(t);

  // Фильтрация стран по поисковому запросу
  const filteredCountries = countriesList.filter(
    country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery),
  );

  // Функция для определения страны по коду
  const detectCountryFromInput = useCallback(input => {
    if (!input || !input.startsWith('+')) {
      setDetectedCountry('');
      return null;
    }

    const digits = input.replace(/\D/g, '');
    if (digits.length === 0) {
      setDetectedCountry('');
      return null;
    }

    // Проверяем коды от самых длинных к коротким
    const sortedCodes = Object.keys(countryCodes).sort(
      (a, b) => b.length - a.length,
    );

    for (const code of sortedCodes) {
      if (digits.startsWith(code)) {
        const country = countryCodes[code];
        const detectedCountry = Array.isArray(country) ? country[0] : country;
        setDetectedCountry(detectedCountry);
        return detectedCountry;
      }
    }

    setDetectedCountry('');
    return null;
  }, []);

  // Инициализация с ОАЭ если значение пустое
  useEffect(() => {
    if (!value) {
      setInputValue('+971 ');
      setDetectedCountry('AE');
      setIsValidPhone(false);
    } else {
      // Форматируем входящее значение для отображения
      const digits = value.replace(/[^\d]/g, '');
      if (value.startsWith('+') && digits.length >= 3) {
        const detectedCode = Object.keys(countryCodes).find(code =>
          digits.startsWith(code),
        );
        if (detectedCode && digits.length > detectedCode.length) {
          setInputValue(
            '+' + detectedCode + ' ' + digits.substring(detectedCode.length),
          );
        } else {
          setInputValue(value);
        }
      } else {
        setInputValue(value);
      }
      detectCountryFromInput(value);
      validatePhoneNumber(value);
    }
  }, [value, detectCountryFromInput, validatePhoneNumber]);

  // Валидация номера телефона
  const validatePhoneNumber = useCallback(
    phoneNumber => {
      try {
        if (!phoneNumber || phoneNumber.length < 4) {
          setValidationError('');
          setIsValidPhone(false);
          return false;
        }

        // Убираем все кроме цифр и + для валидации
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

        if (cleanNumber === '+' || cleanNumber.length < 4) {
          setValidationError('');
          setIsValidPhone(false);
          return false;
        }

        // Проверяем что номер начинается с + и содержит цифры
        if (!cleanNumber.startsWith('+')) {
          setValidationError(t('Phone must start with +'));
          setIsValidPhone(false);
          return false;
        }

        const parsed = parsePhoneNumber(cleanNumber);
        const isValid = isValidPhoneNumber(cleanNumber);

        if (parsed && isValid) {
          setValidationError('');
          setIsValidPhone(true);
          return true;
        } else {
          setValidationError(t('Invalid phone format'));
          setIsValidPhone(false);
          return false;
        }
      } catch (e) {
        console.log('Validation error:', e);
        setValidationError(t('Invalid phone format'));
        setIsValidPhone(false);
        return false;
      }
    },
    [t],
  );

  // Функция определения цвета границы
  const getBorderColor = () => {
    if (error || validationError) return styles.colors.red;
    if (isFocused) return styles.colors.primary;
    return styles.colors.border;
  };

  const handlePhoneChange = text => {
    // Разрешаем пользователю вводить что угодно, включая полное удаление
    let cleanedText = text;

    // Если ввод не начинается с +, добавляем его только если есть цифры
    if (cleanedText && !cleanedText.startsWith('+') && /\d/.test(cleanedText)) {
      cleanedText = '+' + cleanedText.replace(/[^\d]/g, '');
    }

    // Если поле пустое, оставляем его пустым (пользователь может полностью очистить)
    if (!cleanedText) {
      setInputValue('');
      setDetectedCountry('');
      setValidationError('');
      setIsValidPhone(false);
      onChange('');
      return;
    }

    // Если только +, оставляем как есть
    if (cleanedText === '+') {
      setInputValue('+');
      setDetectedCountry('');
      setValidationError('');
      setIsValidPhone(false);
      onChange('+');
      return;
    }

    // Определяем страну по коду
    detectCountryFromInput(cleanedText);

    // Форматируем номер для отображения и передачи
    const digits = cleanedText.replace(/[^\d]/g, '');
    let displayValue = cleanedText;
    let outputValue = cleanedText;

    if (cleanedText.startsWith('+') && digits.length >= 3) {
      const detectedCode = Object.keys(countryCodes).find(code =>
        digits.startsWith(code),
      );
      if (detectedCode && digits.length > detectedCode.length) {
        // Для отображения: код + пробел + остальные цифры
        displayValue =
          '+' + detectedCode + ' ' + digits.substring(detectedCode.length);
        // Для передачи: код + остальные цифры без пробела
        outputValue = '+' + digits;
      } else if (detectedCode) {
        // Если только код страны
        displayValue = '+' + detectedCode;
        outputValue = '+' + detectedCode;
      }
    }

    setInputValue(displayValue);
    validatePhoneNumber(outputValue);
    onChange(outputValue);
  };

  // При потере фокуса, если поле пустое, ставим ОАЭ по умолчанию
  const handleBlur = () => {
    setIsFocused(false);
    if (!inputValue || inputValue === '+' || inputValue.trim() === '+971') {
      setInputValue('+971 ');
      setDetectedCountry('AE');
      setIsValidPhone(false);
      onChange('+971');
    }
  };

  // Обработчик выбора страны
  const handleCountrySelect = country => {
    const displayValue = `+${country.code} `;
    const outputValue = `+${country.code}`;
    setInputValue(displayValue);
    setDetectedCountry(country.countryCode);
    setShowCountryModal(false);
    setSearchQuery('');
    setIsValidPhone(false); // Сброс валидации при смене страны
    onChange(outputValue);
    validatePhoneNumber(outputValue);
  };

  // Получаем текущий код страны для кнопки
  const getCurrentCountryCode = () => {
    const match = inputValue.match(/^\+(\d+)/);
    return match ? match[1] : '971';
  };

  // Получаем максимальную длину номера для текущей страны
  const getMaxLengthForCurrentCountry = () => {
    const currentCode = getCurrentCountryCode();
    return countryPhoneLengths[currentCode] || 15; // По умолчанию 15 если страна не найдена
  };

  const currentError = error || validationError;

  return (
    <View style={[phoneInputStyles.container, {width}]}>
      {/* Плавающий placeholder */}
      <Text
        style={[
          phoneInputStyles.placeholderLabel,
          inputValue?.length > 0 && phoneInputStyles.activePlaceholder,
        ]}>
        {inputValue?.length > 0 && placeholder}
      </Text>

      <View
        style={[
          phoneInputStyles.phoneInputContainer,
          {borderColor: getBorderColor()},
        ]}>
        {/* Кнопка выбора кода страны */}
        <TouchableOpacity
          style={phoneInputStyles.countryButton}
          onPress={() => setShowCountryModal(true)}
          disabled={disabled}>
          <Text style={phoneInputStyles.countryButtonText}>
            +{getCurrentCountryCode()}
          </Text>
        </TouchableOpacity>

        <TextInput
          value={inputValue.replace(/^\+\d+\s?/, '')} // Показываем только номер без кода страны
          onChangeText={text => {
            const currentCode = getCurrentCountryCode();
            const newValue = `+${currentCode} ${text}`;
            handlePhoneChange(newValue);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#8a94A0"
          keyboardType="phone-pad"
          editable={!disabled}
          style={[
            phoneInputStyles.textInput,
            disabled && phoneInputStyles.disabledInput,
          ]}
          maxLength={getMaxLengthForCurrentCountry()}
        />
        {isValidPhone && !currentError && inputValue.length > 4 && (
          <Ionicons style={phoneInputStyles.checkmarkIcon} name={'checkmark'} />
        )}
      </View>

      {currentError && (
        <Text style={phoneInputStyles.errorText}>{currentError}</Text>
      )}

      {/* Выпадающее меню выбора страны */}
      {showCountryModal && (
        <View style={phoneInputStyles.dropdown}>
          <View style={phoneInputStyles.dropdownHeader}>
            <Text style={phoneInputStyles.dropdownTitle}>
              {t('Select country')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCountryModal(false)}
              style={phoneInputStyles.closeButton}>
              <Ionicons name="close" size={20} color={styles.colors.black} />
            </TouchableOpacity>
          </View>

          <View style={phoneInputStyles.searchContainer}>
            <View style={phoneInputStyles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={20}
                color={styles.colors.placeholderColor}
                style={phoneInputStyles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('Search countries')}
                placeholderTextColor={styles.colors.placeholderColor}
                style={phoneInputStyles.searchTextInput}
              />
            </View>
          </View>

          <ScrollView
            style={phoneInputStyles.dropdownList}
            showsVerticalScrollIndicator={false}>
            {filteredCountries.map(item => (
              <TouchableOpacity
                key={item.code + item.countryCode}
                style={phoneInputStyles.countryItem}
                onPress={() => handleCountrySelect(item)}>
                <Text style={phoneInputStyles.countryCode}>+{item.code}</Text>
                <Text style={phoneInputStyles.countryName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const phoneInputStyles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 5,
    zIndex: 1,
  },
  placeholderLabel: {
    position: 'absolute',
    top: -10,
    zIndex: 3,
    left: 12,
    padding: 0,
    backgroundColor: styles.colors.white,
    fontSize: styles.fonSize.sm,
    color: '#8a94a0',
  },
  activePlaceholder: {
    padding: 3,
  },
  phoneInputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    height: 50,
    justifyContent: 'center',
  },
  countryButtonText: {
    fontSize: 14,
    color: styles.colors.input,
    fontWeight: 'normal',
    lineHeight: 16,
    includeFontPadding: false,
  },

  textInput: {
    flex: 1,
    fontSize: 14,
    color: styles.colors.input,
    height: 50,
    paddingVertical: 0,
    paddingLeft: 8,
    paddingRight: 12,
    textAlignVertical: 'center',
    lineHeight: 16,
    includeFontPadding: false,
  },
  disabledInput: {
    color: styles.colors.grey,
    backgroundColor: styles.colors.background,
  },
  checkmarkIcon: {
    color: styles.colors.primary,
    fontSize: styles.fonSize.md + 5,
    marginRight: 10,
    fontWeight: '700',
  },
  errorText: {
    fontSize: styles.fonSize.smd,
    color: styles.colors.red,
    paddingTop: 5,
    marginTop: 2,
  },
  dropdown: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: styles.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: styles.colors.border,
    maxHeight: 300,
    zIndex: 1000,
    elevation: 10,
    shadowColor: styles.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.border,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: styles.colors.black,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: styles.colors.inputBackground,
    paddingHorizontal: 10,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
    color: styles.colors.placeholderColor,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: styles.colors.gray,
    fontWeight: '500',
  },
  dropdownList: {
    maxHeight: 200,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: styles.colors.background,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '500',
    color: styles.colors.primary,
    minWidth: 60,
  },
  countryName: {
    fontSize: 14,
    color: styles.colors.black,
    flex: 1,
  },
});

export default StandardPhoneInput;
