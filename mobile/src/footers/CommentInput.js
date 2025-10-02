import React, {useState} from 'react';
import {Dimensions, Image, TextInput, TouchableOpacity, View} from 'react-native';
import styles from '../styles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmojiPicker from 'rn-emoji-keyboard';
import {useKeyboardVisible} from '../hooks/useKeyboardVisible';
import StandardInput from '../components/StandardInput';

export default CommentInput = ({
  placeholder = '',
  value = '',
  onChange = () => {},
  secureTextEntry = false,
  autoFocus = false,
  handleSend = () => {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {isKeyboardOpen} = useKeyboardVisible();
  return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingBottom: 20
        }}>
        <StandardInput placeholder='Write comment...' value={value} onChange={onChange} width="85%"/>
        <TouchableOpacity onPress={handleSend}>
          <Image source={require('../images/send.png')} style={{width:45, height:45}}/>
        </TouchableOpacity>
      </View>
  );
};
