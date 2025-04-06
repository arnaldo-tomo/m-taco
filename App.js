
import { View } from 'react-native'
import Route from './router/Route'
import FlashMessage from "react-native-flash-message";
export default function App () {
  return <View style={{ flex: 1 }}>
      <Route />
      <FlashMessage style={{ marginTop:40 }} position="top" />
    </View>;
}
