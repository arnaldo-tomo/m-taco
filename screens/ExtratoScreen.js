import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageBackground
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useNavigation } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Ionicons from '@expo/vector-icons/Ionicons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DropDownPicker from 'react-native-dropdown-picker'
const ExtratoScreen = () => {
  const navigation = useNavigation()

  const [transactions, setTransactions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [categories, setCategories] = useState([])
  const [totalAcumulado, setTotalAcumulado] = useState(0)
  const [viewType, setViewType] = useState('tudo')
  const [userName, setUserName] = useState(null)
  const [currentMonth, setCurrentMonth] = useState('')
  useEffect(() => {
    const month = format(new Date(), 'MMMM', { locale: ptBR })
    setCurrentMonth(month.charAt(0).toUpperCase() + month.slice(1))
    const fetchUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId')
        const storedUserName = await AsyncStorage.getItem('userName')

        if (storedUserId !== null && storedUserName !== null) {
          setUserId(storedUserId)
          setUserName(storedUserName)
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
      }
    }
    async function fetchCategories () {
      try {
        const response = await axios.get(
'https://apimytaco.networkmoz.com/api/categories'

        )
        setCategories(response.data)
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    async function fetchTransactions () {
      try {
        const userId = await AsyncStorage.getItem('userId')
        const response = await axios.get(
          'https://apimytaco.networkmoz.com/api/filtered-transactions',
          {
            params: {
              user_id: userId,
              month: selectedMonth,
              year: selectedYear,
              category: selectedCategory !== 'Todas' ? selectedCategory : null
            }
          }
        )
        const filteredTransactions = response.data.filter(transaction => {
          if (viewType === 'tudo') return true
          if (viewType === 'entradas' && transaction.type === 'entrada')
            return true
          if (viewType === 'despesas' && transaction.type === 'gasto')
            return true
          return false
        })

        setTransactions(filteredTransactions)

        const total = filteredTransactions.reduce(
          (acc, transaction) => acc + parseFloat(transaction.amount),
          0
        )
        setTotalAcumulado(total)
      } catch (error) {
        console.error('Erro ao buscar transações:', error)
      }
    }
    fetchTransactions()
  }, [selectedCategory, selectedMonth, selectedYear, viewType])

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value)
  }

  // const FilterSection = () => (
  //   <BlurView
  //     intensity={90}
  //     tint='dark'
  //     style={{
  //       padding: 10,
  //       borderRadius: 16,
  //       overflow: 'hidden',
  //       marginBottom: 20
  //     }}
  //   >
  //     <Text
  //       style={{
  //         color: 'white',
  //         marginBottom: 5,
  //         fontSize: 16,
  //         fontWeight: 'bold'
  //       }}
  //     >
  //       Filtrar por:
  //     </Text>

  //     <View
  //       style={{
  //         flexDirection: 'row',
  //         justifyContent: 'space-between',
  //         alignItems: 'center'
  //       }}
  //     >
  //       {/* Filtro por Categoria */}
  //       <View
  //         style={{
  //           flexDirection: 'column',
  //           flex: 1,
  //           marginRight: 5
  //         }}
  //       >
  //         <View
  //           style={{
  //             flexDirection: 'row',
  //             alignItems: 'center',
  //             borderRadius: 10,
  //             paddingHorizontal: 10
  //           }}
  //         >
  //           <Ionicons name='filter-outline' size={20} color='white' />
  //           <Picker
  //             selectedValue={selectedCategory}
  //             style={{
  //               width: '100%',
  //               color: 'white',
  //               backgroundColor: 'transparent',
  //               marginLeft: -10
  //             }}
  //             onValueChange={itemValue => setSelectedCategory(itemValue)}
  //             dropdownIconColor='transparent'
  //           >
  //             <Picker.Item label='Todas Categorias' value='Todas' />
  //             {categories.map(category => (
  //               <Picker.Item
  //                 key={category.id}
  //                 label={category.name}
  //                 value={category.name}
  //               />
  //             ))}
  //           </Picker>
  //         </View>
  //         <Text style={{ color: 'white', textAlign: 'center' }}>
  //           {selectedCategory !== 'Todas'
  //             ? `Categoria: ${selectedCategory}`
  //             : 'Todas Categorias'}
  //         </Text>
  //       </View>

  //       {/* Filtro por Mês */}
  //       <View
  //         style={{
  //           flexDirection: 'column',
  //           flex: 0.8,
  //           marginHorizontal: 5
  //         }}
  //       >
  //         <View
  //           style={{
  //             flexDirection: 'row',
  //             alignItems: 'center',
  //             borderRadius: 10,
  //             paddingHorizontal: 10
  //           }}
  //         >
  //           <Ionicons name='calendar-outline' size={20} color='white' />
  //           <Picker
  //             selectedValue={selectedMonth}
  //             style={{
  //               width: '100%',
  //               color: 'white',
  //               backgroundColor: 'transparent',
  //               marginLeft: -10
  //             }}
  //             onValueChange={itemValue => setSelectedMonth(itemValue)}
  //             dropdownIconColor='transparent'
  //           >
  //             {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
  //               <Picker.Item
  //                 key={month}
  //                 label={new Date(0, month - 1).toLocaleString('pt-BR', {
  //                   month: 'long'
  //                 })}
  //                 value={month}
  //               />
  //             ))}
  //           </Picker>
  //         </View>
  //         <Text style={{ color: 'white', textAlign: 'center' }}>
  //           {new Date(0, selectedMonth - 1).toLocaleString('pt-BR', {
  //             month: 'long'
  //           })}
  //         </Text>
  //       </View>

  //       {/* Filtro por Ano */}
  //       <View
  //         style={{
  //           flexDirection: 'column',
  //           flex: 0.8,
  //           marginLeft: 5
  //         }}
  //       >
  //         <View
  //           style={{
  //             flexDirection: 'row',
  //             alignItems: 'center',
  //             borderRadius: 10,
  //             paddingHorizontal: 10
  //           }}
  //         >
  //           <Ionicons name='time-outline' size={20} color='white' />
  //           <Picker
  //             selectedValue={selectedYear}
  //             style={{
  //               width: '100%',
  //               color: 'white',
  //               backgroundColor: 'transparent',
  //               marginLeft: -10
  //             }}
  //             onValueChange={itemValue => setSelectedYear(itemValue)}
  //             dropdownIconColor='transparent'
  //           >
  //             {Array.from(
  //               { length: new Date().getFullYear() - 2010 + 1 },
  //               (_, i) => 2010 + i
  //             ).map(year => (
  //               <Picker.Item key={year} label={year.toString()} value={year} />
  //             ))}
  //           </Picker>
  //         </View>
  //         <Text style={{ color: 'white', textAlign: 'center' }}>
  //           Ano: {selectedYear}
  //         </Text>
  //       </View>
  //     </View>
  //   </BlurView>
  // )

  const SummarySection = () => (
    <BlurView
      intensity={50}
      tint='dark'
      style={{
        padding: 10,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        marginHorizontal: 15,
        justifyContent: 'space-between',
        flexDirection: 'row'
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 20,
          fontWeight: 'bold',
          alignSelf: 'center'
        }}
      >
        Saldo :
      </Text>
      <Text
        style={{
          color: 'white',
          fontSize: 20,
          // fontWeight: 'bold',
          alignSelf: 'center'
        }}
      >
        {formatCurrency(totalAcumulado)}
      </Text>
    </BlurView>
  )

  return (
    <ImageBackground
      source={require('../assets/bg.png')}
      style={{ flex: 1, paddingTop: 35 }}
    >
      <View
        style={{
          padding: 10
        }}
      >
        <TouchableOpacity
          style={{
            alignItems: 'center',
            alignContent: 'center',
            alignSelf: 'center'
          }}
        >
          <Image
            source={require('../assets/logo.png')}
            style={{ height: 30, width: 30, tintColor: 'white' }}
          />
        </TouchableOpacity>
      </View>
      <SummarySection />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: 10
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor:
              viewType === 'tudo' ? 'rgba(30, 29, 37, 0.5)' : '#3e3e3e',
            padding: 10,
            borderRadius: 10,
            marginHorizontal: 8,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 2
          }}
          onPress={() => setViewType('tudo')}
        >
          <Text style={{ color: 'white', fontSize: 14 }}>Tudo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor:
              viewType === 'entradas' ? 'rgba(30, 29, 37, 0.5)' : '#3e3e3e',
            padding: 10,
            borderRadius: 10,
            marginHorizontal: 5
          }}
          onPress={() => setViewType('entradas')}
        >
          <Text style={{ color: 'white', fontSize: 14 }}>Entradas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor:
              viewType === 'despesas' ? 'rgba(30, 29, 37, 0.5)' : '#3e3e3e',
            padding: 10,
            borderRadius: 10,
            marginHorizontal: 5
          }}
          onPress={() => setViewType('despesas')}
        >
          <Text style={{ color: 'white', fontSize: 14 }}>Despesas</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          paddingTop: 10,
          paddingHorizontal: 16,
          borderRadius: 26,
          overflow: 'hidden'
        }}
      >
        {/* <FilterSection /> */}

        {transactions.map((transaction, index) => (
          <BlurView
            key={`${transaction.id}-${index}`}
            intensity={90}
            tint='dark'
            style={{
              padding: 10,
              borderRadius: 16,
              overflow: 'hidden',
              marginTop: 5
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Image
                  source={
                    transaction.type === 'entrada'
                      ? require('../assets/up.png')
                      : require('../assets/down.png')
                  }
                  style={{
                    height: 30,
                    width: 30,
                    tintColor:
                      transaction.type === 'entrada' ? '#299318' : 'red'
                  }}
                />
                <Text
                  style={{
                    color: 'white',
                    paddingLeft: 10,
                    fontWeight: 'bold'
                  }}
                >
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
              <Text style={{ color: 'white', paddingLeft: 10 }}>
                {transaction.date}
              </Text>
            </View>
          </BlurView>
        ))}
      </ScrollView>
    </ImageBackground>
  )
}

export default ExtratoScreen
