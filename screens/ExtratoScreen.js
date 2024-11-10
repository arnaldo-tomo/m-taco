import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator
} from "react-native";
import { BlurView } from "expo-blur";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_UEL } from "../config/app";
import { Image } from "expo-image";

const ExtratoScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState("tudo");
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState({});
  const [entries, setEntries] = useState({}); // Agrupar entradas por ano/mês

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_UEL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      }
    };

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const userId = await AsyncStorage.getItem("userId");
        const response = await axios.get(`${API_UEL}/transacoes`, {
          params: {
            user_id: userId
          }
        });
        setTransactions(response.data);
        setIsLoading(false); // Desativa o carregamento
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
      }
    };

    fetchCategories();
    fetchTransactions();
  }, []);

  useEffect(
    () => {
      if (viewType === "entradas") {
        // Carregar entradas da API quando "Entradas" for selecionado
        const fetchEntries = async () => {
          try {
            const userId = await AsyncStorage.getItem("userId");
            const response = await axios.get(
              `${API_UEL}/entries/current-month`,
              {
                params: {
                  user_id: userId
                }
              }
            );

            // Agrupar entradas por ano e mês
            const entriesByYear = response.data.reduce((accYear, entry) => {
              const entryDate = new Date(entry.entry_date);
              const year = entryDate.getFullYear();
              const month = entryDate.getMonth();

              if (!accYear[year]) {
                accYear[year] = {};
              }

              if (!accYear[year][month]) {
                accYear[year][month] = {
                  total: 0,
                  entradas: []
                };
              }

              accYear[year][month].total += parseFloat(entry.amount);
              accYear[year][month].entradas.push(entry);

              return accYear;
            }, {});

            setEntries(entriesByYear); // Armazena as entradas agrupadas
          } catch (error) {
            console.error("Erro ao buscar entradas:", error);
          }
        };

        fetchEntries();
      } else {
        // Filtro para transações e categorias
        const filterTransactionsByCategory = () => {
          const categorizedTransactions = categories.reduce((acc, category) => {
            const categoryTransactions = transactions.filter(
              transaction => transaction.category_id === category.id
            );

            // Agrupamento por anos e meses
            if (categoryTransactions.length > 0) {
              const transactionsByYear = categoryTransactions.reduce(
                (accYear, transaction) => {
                  const transactionDate = new Date(transaction.expense_date);
                  const year = transactionDate.getFullYear();
                  const month = transactionDate.getMonth();

                  if (!accYear[year]) {
                    accYear[year] = {};
                  }

                  if (!accYear[year][month]) {
                    accYear[year][month] = {
                      total: 0,
                      transacoes: []
                    };
                  }

                  accYear[year][month].total += parseFloat(transaction.amount);
                  accYear[year][month].transacoes.push(transaction);

                  return accYear;
                },
                {}
              );

              acc[category.name] = transactionsByYear;
            }

            return acc;
          }, {});

          setFilteredTransactions(categorizedTransactions);
        };

        filterTransactionsByCategory();
      }
    },
    [viewType, transactions, categories]
  );

  const formatCurrency = value => {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN"
    }).format(value);
  };

  // Função para renderizar as transações agrupadas por categoria e ano e mês
  // Função para renderizar as entradas agrupadas por ano e mês

  const renderEntries = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 20 }}
        />
      );
    }

    if (Object.keys(entries).length === 0) {
      return (
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
                {" "}Nenhuma entrada encontrada
              </Text>
            </View>
          </View>
        </BlurView>
      );
    }
    return Object.keys(entries).map((year, yearIndex) =>
      <View
        key={yearIndex}
        style={{
          marginBottom: 20
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 17
          }}
        >
          {year} {/* Exibe o ano */}
        </Text>

        {/* Exibir entradas agrupadas por mês */}
        {Object.keys(entries[year]).map((month, monthIndex) =>
          <View
            key={monthIndex}
            style={{
              marginBottom: 10
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: 15,
                marginTop: 10,
                marginHorizontal: 5
              }}
            >
              {/* Exibe o nome do mês e o total de entradas do mês */}
              {format(new Date(year, month), "MMMM", { locale: ptBR })} - Total:{" "}
              {formatCurrency(entries[year][month].total)}
            </Text>

            {/* Exibindo as entradas do mês */}
            {entries[year][month].entradas.map((entry, i) =>
              <BlurView
                key={entry.id}
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
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 16
                    }}
                  >
                    {formatCurrency(entry.amount)}
                  </Text>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 14
                    }}
                  >
                    {entry.entry_date}
                  </Text>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 12
                    }}
                  >
                    {entry.origim}
                  </Text>
                </View>
              </BlurView>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderTransactionsByCategory = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 20 }}
        />
      );
    }

    if (Object.keys(filteredTransactions).length === 0) {
      return (
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
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  alignSelf: "center"
                }}
              >
                Nenhuma Despesa encontrada
              </Text>
            </View>
          </View>
        </BlurView>
      );
    }

    return Object.keys(filteredTransactions).map((categoria, index) =>
      <View
        key={index}
        style={{
          marginBottom: 20
        }}
      >
        {/* Exibindo o nome da categoria */}
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 17,
            marginBottom: 5,
            marginHorizontal: 5
          }}
        >
          {categoria}
        </Text>
        <View
          style={{
            borderColor: "rgba(30, 29, 37, 0.8)",
            borderWidth: 0.3,

            marginVertical: 10,
            opacity: 0.5,
            marginHorizontal: 50
          }}
        />

        {/* Exibindo transações agrupadas por ano */}
        {Object.keys(filteredTransactions[categoria]).map((year, yearIndex) =>
          <View key={yearIndex}>
            <View
              style={{
                flexDirection: "row"
              }}
            >
              <Ionicons
                name="calendar-clear-outline"
                color={"white"}
                style={{
                  marginHorizontal: 5
                }}
              />
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 10
                }}
              >
                {year} {/* Exibe o ano */}
              </Text>
            </View>

            {/* Exibindo transações agrupadas por mês dentro do ano */}
            {Object.keys(
              filteredTransactions[categoria][year]
            ).map((month, monthIndex) =>
              <View
                key={monthIndex}
                style={{
                  marginBottom: 10
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 15,
                    marginTop: 10,
                    marginHorizontal: 5
                  }}
                >
                  {/* Exibe o nome do mês e o total de despesas do mês */}
                  {format(new Date(year, month), "MMMM", { locale: ptBR })} -
                  Total:{" "}
                  {formatCurrency(
                    filteredTransactions[categoria][year][month].total
                  )}
                </Text>

                {/* Exibindo as transações do mês */}
                {filteredTransactions[categoria][year][
                  month
                ].transacoes.map((transaction, i) =>
                  <BlurView
                    key={`${transaction.id}-${i}`}
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
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "bold",
                          fontSize: 16
                        }}
                      >
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 14
                        }}
                      >
                        {transaction.expense_date}
                      </Text>
                    </View>
                  </BlurView>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/bg.png")}
      style={{ flex: 1, paddingTop: 35 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 20,
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          marginHorizontal: 12
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={30} color={"white"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor:
              viewType === "entradas"
                ? "rgba(30, 29, 37, 0.5)"
                : "rgba(30, 29, 37, 0.9)",
            padding: 10,
            borderRadius: 10,
            marginHorizontal: 5,
            paddingHorizontal: 20,
            elevation: 5
          }}
          onPress={() => setViewType("entradas")}
        >
          <Text style={{ color: "white", fontSize: 14 }}>Entradas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor:
              viewType === "despesas"
                ? "rgba(30, 29, 37, 0.5)"
                : "rgba(30, 29, 37, 0.9)",
            padding: 10,
            borderRadius: 10,
            marginHorizontal: 5,
            paddingHorizontal: 20,
            elevation: 5
          }}
          onPress={() => setViewType("despesas")}
        >
          <Text style={{ color: "white", fontSize: 14 }}>Despesas</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignContent: "center",
              alignItems: "center"
            }}
          >
            <Image
              source={require("../assets/loading.gif")}
              style={{ width: 50, height: 50 }}
            />
          </View>
        : entries.length === 0
          ? <View
              style={{ marginTop: 20, alignItems: "center" } // Exibe "Não encontrado" se a lista estiver vazia
              }
            >
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
                      Nenhum dado encontrado
                    </Text>
                    {/* <Image source={require('../assets/loading.gif')} style={{width:20,height:20}} /> */}
                  </View>
                </View>
              </BlurView>
            </View>
          : <ScrollView
              showsVerticalScrollIndicator={false}
              style={{
                paddingTop: 10,
                paddingHorizontal: 16,
                borderRadius: 26,
                overflow: "hidden"
              }}
            >
              {viewType === "entradas"
                ? renderEntries()
                : renderTransactionsByCategory()}
            </ScrollView>}
    </ImageBackground>
  );
};

export default ExtratoScreen;
