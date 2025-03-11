import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
  Platform,
  StyleSheet
} from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import {
  PermissionModal,
  PermissionItem
} from "react-native-permissions-modal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TextInput } from "react-native";
import { Formik } from "formik";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import DropDownPicker from "react-native-dropdown-picker";

import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as Yup from "yup";

import { showMessage, hideMessage } from "react-native-flash-message";
import { API_UEL } from "../config/app";
export default function HomeScreen({ navigation }) {
  const [successMessage, setSuccessMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [currentMonth, setCurrentMonth] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [value, setValue] = useState(null);
  const validationSchema = Yup.object().shape({
    expenseValue: Yup.number()
      .required("O valor do gasto é obrigatório")
      .positive("O valor deve ser positivo")
      .typeError("Digite um valor válido")
  });

  const renderItem = (item) => {
    return (
      <View style={styles.item}>
        <Text style={styles.textItem}>{item.label}</Text>
        {item.value === value && (
          <AntDesign
            style={styles.icon}
            color="black"
            name="Safety"
            size={20}
          />
        )}
      </View>
    );
  };
  useEffect(() => {
    const month = format(new Date(), "MMMM", { locale: ptBR });
    setCurrentMonth(month.charAt(0).toUpperCase() + month.slice(1));

    const fetchUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        const storedUserName = await AsyncStorage.getItem("userName");

        if (storedUserId !== null && storedUserName !== null) {
          setUserId(storedUserId);
          setUserName(storedUserName);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_UEL}/categories`);
        const formattedItems = response.data.map((category) => ({
          label: category.name,
          value: category.id
        }));
        setItems(formattedItems);
        setSelectedCategory(formattedItems[0]?.value || null); // Seleciona a primeira categoria por padrão
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    fetchTransactions();
    fetchUserData();
    fetchCategories();
  }, []);

  const fetchSummary = async () => {
    const userId = await AsyncStorage.getItem("userId");
    try {
      const response = await axios.get(`${API_UEL}/monthly-summary`, {
        params: { user_id: userId }
      });
      setTotalEntries(response.data.total_entries);
      setTotalExpenses(response.data.total_expenses);
    } catch (error) {
      console.error("Erro ao buscar resumo mensal:", error);
    }
  };
  const submitForm = async (values, { resetForm }) => {
    try {
      // Obter o user_id do AsyncStorage
      const userId = await AsyncStorage.getItem("userId");

      // Adicionar o user_id aos valores do formulário
      const formData = { ...values, user_id: userId };

      // Enviar os dados para a API
      const response = await axios.post(`${API_UEL}/entries`, formData);

      console.log("Entrada registrada com sucesso:", response.data);
      // Atualizar a lista de transações
      fetchSummary();
      fetchTransactions();
      // Definir mensagem de sucesso
      setSuccessMessage("Entrada registrada com sucesso!");
      showMessage({
        message: "Entrada registrada com sucesso!",
        type: "success",
        animated: true,
        animationDuration: 300,
        floating: true
      });
      // Limpar o formulário
      resetForm();
      this.permModal.closeModal();
      // Opcional: remover a mensagem de sucesso após alguns segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
      // Tratar o erro, como mostrar uma mensagem ao usuário
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace("Auth_login");
    } catch (error) {
      console.error("Erro ao limpar AsyncStorage:", error);
    }
  };

  const handleExpenseSubmit = async (values, { resetForm }) => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      const payload = {
        ...values,
        category: value,
        user_id: userId // Incluindo o user_id
      };

      const response = await axios.post(`${API_UEL}/expenses`, payload);

      console.log("Gasto registrado com sucesso:", response.data);
      fetchSummary();
      fetchTransactions();
      // Definir mensagem de sucesso
      showMessage({
        message: "Gasto registrado com sucesso!",
        type: "success",
        animated: true,
        animationDuration: 300,
        floating: true
      });
      setSuccessMessage("Gasto registrado com sucesso!");
      this.expenseModal.closeModal();
      // Limpar o formulário
      resetForm();

      // Opcional: remover a mensagem de sucesso após alguns segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao registrar gasto:", error);
      // Tratar o erro, como mostrar uma mensagem ao usuário
    }
  };

  const fetchTransactions = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await axios.get(`${API_UEL}/transacoes`, {
        params: {
          user_id: userId
        }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN"
    }).format(value);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* <ActivityIndicator size='large' color='#0000ff' /> */}
        <Image
          source={require("../assets/spinner.gif")}
          style={{ width: 100, height: 100 }}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <ImageBackground
        source={require("../assets/bg.png")}
        style={{ flex: 1, paddingTop: 35 }}
      >
        {/* Header com nome do usuário e botões */}
        <View
          style={{
            padding: 10,
            flexDirection: "row",
            justifyContent: "space-between"
          }}
        >
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Image
              source={require("../assets/logo.png")}
              style={{ height: 30, width: 30, tintColor: "white" }}
            />
            <View>
              <Text style={{ paddingHorizontal: 5, color: "white" }}>
                {userName}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  paddingHorizontal: 5,
                  color: "white",
                  marginTop: -5
                }}
              >
                {currentMonth}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Botão de perfil */}
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate("ProfileScreen")}
            >
              <Image
                source={require("../assets/Icons/user.svg")}
                style={{ height: 30, width: 30, tintColor: "white" }}
              />
            </TouchableOpacity>

            {/* Botão de logout */}
            <TouchableOpacity onPress={handleLogout}>
              <Image
                source={require("../assets/off.png")}
                style={{ height: 30, width: 30, tintColor: "white" }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 10,
            alignItems: "center",
            marginTop: 50,
            marginBottom: 50
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../assets/up.png")}
              style={{
                height: 30,
                width: 30,
                tintColor: "#299318",
                marginRight: 10
              }}
            />
            <Text
              style={{
                paddingHorizontal: 5,
                fontSize: 20,
                color: "white",
                fontWeight: "bold"
              }}
            >
              {formatCurrency(totalEntries)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../assets/down.png")}
              style={{
                height: 30,
                width: 30,
                tintColor: "red",
                marginRight: 10
              }}
            />
            <Text
              style={{
                paddingHorizontal: 5,
                color: "white",
                fontWeight: "bold"
              }}
            >
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 22,
            alignItems: "center",
            paddingBottom: 5,
            flexDirection: "row",
            justifyContent: "space-between"
          }}
        >
          <TouchableOpacity
            onPress={() => this.permModal.openModal()}
            style={{
              borderColor: "#8c97b5",
              borderWidth: 0.5,
              borderRadius: 15,
              padding: 15
            }}
          >
            <Image
              source={require("../assets/up.png")}
              style={{ height: 30, width: 30, tintColor: "white" }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.expenseModal.openModal()}
            style={{
              borderColor: "#be5cc3",
              borderWidth: 0.5,
              borderRadius: 15,
              padding: 15
            }}
          >
            <Image
              source={require("../assets/down.png")}
              style={{ height: 30, width: 30, tintColor: "white" }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("ExtratoScreen")}
            style={{
              borderColor: "white",
              borderWidth: 0.5,
              borderRadius: 15,
              padding: 15
            }}
          >
            <Image
              source={require("../assets/wallet.png")}
              style={{ height: 30, width: 30, tintColor: "white" }}
            />
          </TouchableOpacity>
        </View>
        <View
          style={{
            paddingHorizontal: 30,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
            // padddinVertical: 30,
            paddingBottom: 10
          }}
        >
          <Text style={{ color: "white", fontSize: 12 }}>Entrada</Text>
          <Text style={{ color: "white", fontSize: 12, paddingRight: 5 }}>  Gastar  </Text>
          <Text style={{ color: "white", fontSize: 12 }}>Extrato</Text>
        </View>


        {/* Menu de Funcionalidades Extras */}
        <View
          style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 15 }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10
            }}
          >
            Ferramentas Financeiras
          </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(52, 152, 219, 0.2)",
                borderRadius: 12,
                padding: 15,
                alignItems: "center",
                width: "30%"
              }}
              onPress={() => navigation.navigate("AnalysisScreen")}
            >
              <Image
                source={require("../assets/Icons/chart.svg")}
                style={{
                  height: 30,
                  width: 30,
                  tintColor: "#3498db",
                  marginBottom: 8
                }}
              />
              <Text
                style={{ color: "white", fontSize: 12, textAlign: "center" }}
              >
                Análise
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "rgba(46, 204, 113, 0.2)",
                borderRadius: 12,
                padding: 15,
                alignItems: "center",
                width: "30%"
              }}
              onPress={() => navigation.navigate("BudgetScreen")}
            >
              <Image
                source={require("../assets/Icons/wallet.png")}
                style={{
                  height: 30,
                  width: 30,
                  tintColor: "#2ecc71",
                  marginBottom: 8
                }}
              />
              <Text
                style={{ color: "white", fontSize: 12, textAlign: "center" }}
              >
                Orçamentos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "rgba(243, 156, 18, 0.2)",
                borderRadius: 12,
                padding: 15,
                alignItems: "center",
                width: "30%"
              }}
              onPress={() => navigation.navigate("FinancialGoalsScreen")}
            >
              <Image
                source={require("../assets/Icons/target.svg")}
                style={{
                  height: 30,
                  width: 30,
                  tintColor: "#f39c12",
                  marginBottom: 8
                }}
              />
              <Text
                style={{ color: "white", fontSize: 12, textAlign: "center" }}
              >
                Metas
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {transactions.length === 0 && (
          <BlurView
            intensity={90}
            tint="dark"
            style={{
              padding: 10,
              borderRadius: 16,
              overflow: "hidden",
              marginHorizontal: 13
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Image
                  source={require("../assets/logo.png")}
                  style={{
                    height: 30,
                    width: 30,
                    tintColor: "rgba(255, 255, 266, 0.5)",
                    marginRight: 5
                  }}
                />
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Tas sem nenhum Gasto
                </Text>
              </View>
            </View>
          </BlurView>
        )}
        <Text
          style={{ color: "white", fontWeight: "bold", paddingHorizontal: 20 }}
        >
          Gastos Recentes
        </Text>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          style={{
            paddingTop: 10,
            paddingHorizontal: 16,
            borderRadius: 26,
            overflow: "hidden"
          }}
        >
          {transactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              onPress={() => navigation.navigate("ExtratoScreen")}
            >
              <BlurView
                key={transaction.id}
                intensity={90}
                tint="dark"
                style={{
                  padding: 10,
                  borderRadius: 16,
                  overflow: "hidden",
                  marginTop: 5
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <Image
                      source={
                        transaction.type === "entrada"
                          ? require("../assets/courseup.svg")
                          : require("../assets/course.svg")
                      }
                      style={{
                        height: 30,
                        width: 30,
                        tintColor:
                          transaction.type === "entrada" ? "#299318" : "red"
                      }}
                    />
                    <Text
                      style={{
                        color: "white",
                        paddingLeft: 10,
                        fontWeight: "bold"
                      }}
                    >
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                  <Text style={{ color: "white", paddingLeft: 10 }}>
                    {transaction.date}
                  </Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ImageBackground>

      <Formik initialValues={{ valor: "", origim: "" }} onSubmit={submitForm}>
        {({ handleChange, handleSubmit, values }) => (
          <PermissionModal
            title="Adicionar Nova Entrada"
            subtitle='Não se esqueça de honrar ao Senhor com o dízimo. "Honra ao Senhor com os teus bens." - Provérbios 3:9'
            panGestureEnabled={true}
            closeOnOverlayTap={true}
            ref={(ref) => (this.permModal = ref)}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <TextInput
                style={{
                  borderColor: "#8c97b5",
                  borderWidth: 0.5,
                  width: "100%",
                  padding: 10,
                  borderRadius: 10
                }}
                onChangeText={handleChange("origim")}
                value={values.origim}
                placeholder="Origem do valor"
                keyboardType="default"
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 10
              }}
            >
              <Image
                source={require("../assets/up.png")}
                style={{
                  height: 30,
                  width: 30,
                  tintColor: "#299318",
                  borderColor: "#8c97b5",
                  borderWidth: 0.5,
                  padding: 24,
                  borderRadius: 10
                }}
              />
              <TextInput
                style={{
                  borderColor: "#8c97b5",
                  borderWidth: 0.5,
                  width: "84%",
                  padding: 10,
                  borderRadius: 10
                }}
                onChangeText={handleChange("valor")}
                value={values.valor}
                placeholder="Digite o valor"
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(30, 29, 37, 6)",
                borderWidth: 0.5,
                borderRadius: 10,
                marginTop: 10,
                borderColor: "#8c97b5"
              }}
              onPress={handleSubmit}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  padding: 10,
                  textAlign: "center"
                }}
              >
                Salvar
              </Text>
            </TouchableOpacity>
            {/* Mostrar mensagem de sucesso */}
            {successMessage ? (
              <Text
                style={{ color: "green", marginTop: 10, textAlign: "center" }}
              >
                {successMessage}
              </Text>
            ) : null}
          </PermissionModal>
        )}
      </Formik>
      <Formik
        initialValues={{ expenseValue: "" }}
        onSubmit={handleExpenseSubmit}
        validationSchema={validationSchema}
      >
        {({
          handleChange: handleExpenseChange,
          handleSubmit: submitExpenseForm,
          values,
          errors, // Erros de validação
          touched, // Indica se o campo foi tocado
          setFieldTouched // Marca o campo como tocado
        }) => (
          <PermissionModal
            title="Registrar Novo Gasto"
            subtitle='O homem prudente vê o perigo e busca refúgio, mas o simples continua e sofre as consequências." - Provérbios 22:3'
            panGestureEnabled={true}
            closeOnOverlayTap={true}
            ref={(ref) => (this.expenseModal = ref)}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <Image
                source={require("../assets/down.png")}
                style={{
                  height: 30,
                  width: 30,
                  tintColor: "red",
                  borderColor: "#8c97b5",
                  borderWidth: 0.5,
                  padding: 24,
                  borderRadius: 10
                }}
              />
              <TextInput
                style={{
                  borderColor:
                    errors.expenseValue && touched.expenseValue
                      ? "red"
                      : "#8c97b5",
                  borderWidth: 0.5,
                  width: "84%",
                  padding: 10,
                  borderRadius: 10
                }}
                onChangeText={handleExpenseChange("expenseValue")}
                onBlur={() => setFieldTouched("expenseValue")} // Marca o campo como tocado
                value={values.expenseValue}
                placeholder="Digite o valor do gasto"
                keyboardType="numeric"
              />
            </View>
            {/* Mostrar mensagem de erro */}
            {errors.expenseValue && touched.expenseValue && (
              <Text style={{ color: "red", marginTop: 5 }}>
                {errors.expenseValue}
              </Text>
            )}

            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={items}
              // nado
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Selecione a Categoria"
              searchPlaceholder="Pesquisar categoria"
              value={value}
              onChange={(item) => {
                setValue(item.value);
              }}
              renderLeftIcon={() => (
                <AntDesign
                  style={styles.icon}
                  color="black"
                  name="Safety"
                  size={20}
                />
              )}
              renderItem={renderItem}
            />

            <TouchableOpacity
              style={{
                backgroundColor: "rgba(30, 29, 37, 6)",
                borderWidth: 0.5,
                borderRadius: 10,
                marginTop: 20,
                borderColor: "#8c97b5",
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 5
                },
                shadowOpacity: 0.2,
                shadowRadius: 1.41,
                elevation: 2
              }}
              onPress={submitExpenseForm}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  padding: 12,
                  textAlign: "center"
                }}
              >
                Salvar
              </Text>
            </TouchableOpacity>

            {/* Mostrar mensagem de sucesso */}
            {successMessage ? (
              <Text
                style={{ color: "green", marginTop: 10, textAlign: "center" }}
              >
                {successMessage}
              </Text>
            ) : null}
          </PermissionModal>
        )}
      </Formik>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    marginTop: 10,
    height: 50,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    borderColor: "#8c97b5",
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderColor: "#8c97b5",
    borderWidth: 0.6,
    overflow: "hidden"

    // elevation: 2
  },
  icon: {
    marginRight: 5
  },
  item: {
    padding: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    alignItems: "center",
    borderRadius: 28,
    overflow: "hidden"
  },
  textItem: {
    flex: 1,
    borderRadius: 12,
    fontSize: 16
  },
  placeholderStyle: {
    borderRadius: 12,
    fontSize: 16
  },
  selectedTextStyle: {
    borderRadius: 12,
    fontSize: 16
  },
  iconStyle: {
    width: 20,
    height: 20
  },
  inputSearchStyle: {
    height: 40,
    borderRadius: 12,
    fontSize: 16
  }
});
