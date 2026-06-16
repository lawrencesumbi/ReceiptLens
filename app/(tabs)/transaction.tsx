import { useTheme } from "@/context/ThemeContext"; // 💡 Gi-import ang imong Theme hook
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { supabase } from "../../utils/supabase";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_CONFIG: { [key: string]: { icon: React.ComponentProps<typeof Ionicons>["name"]; color: string } } = {
  "Food & Drinks": { icon: "fast-food-outline", color: "#FF9500" }, 
  "Groceries": { icon: "cart-outline", color: "#4CAF50" },         
  "Transportation": { icon: "car-outline", color: "#6366F1" },     
  "Shopping": { icon: "shirt-outline", color: "#FF2D55" },          
  "Utilities": { icon: "flash-outline", color: "#007AFF" },         
  "Health": { icon: "heart-outline", color: "#FF3B30" },            
  "Entertainment": { icon: "film-outline", color: "#AF52DE" },      
  "Miscellaneous": { icon: "receipt-outline", color: "#8E8E93" },   
};

export default function TransactionScreen() {
  const { colors } = useTheme(); // 💡 Gi-consume ang dynamic theme variables
  
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [transactions, setTransactions] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Drinks");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (params.openModal === "true") {
      setIsEditing(false);
      setModalVisible(true);
      router.setParams({ openModal: undefined });
    }
  }, [params.openModal]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "No transactions found.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!merchant.trim() || !amount.trim()) {
      Alert.alert("Error", "Please enter a Store Name and Amount.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Invalid amount entered.");
      return;
    }

    try {
      setLoading(true);

      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from("transactions")
          .update({
            merchant: merchant.trim(),
            amount: parsedAmount,
            category: category,
            payment_method: paymentMethod,
          })
          .eq("id", editingId)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTransactions(transactions.map((tx) => (tx.id === editingId ? data[0] : tx)));
        }
        Alert.alert("Success", "Transaction updated successfully.");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user found.");

        const { data, error } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: user.id,
              merchant: merchant.trim(),
              amount: parsedAmount,
              category: category,
              payment_method: paymentMethod,
              receipt_url: null,
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTransactions([data[0], ...transactions]);
        }
        Alert.alert("Success", "Transaction recorded successfully.");
      }

      closeModal();
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Upload Error", error.message || "The server rejected the request to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from("transactions")
                .delete()
                .eq("id", id);

              if (error) throw error;

              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setTransactions(transactions.filter((tx) => tx.id !== id));
              setExpandedId(null);
              
              Alert.alert("Success", "Transaction deleted successfully.");
            } catch (error: any) {
              console.error("Delete error:", error);
              Alert.alert("Error", "The server rejected the request to delete.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const startEditTransaction = (tx: any) => {
    setEditingId(tx.id);
    setMerchant(tx.merchant);
    setAmount(tx.amount.toString());
    setCategory(tx.category);
    setPaymentMethod(tx.payment_method);
    setIsEditing(true);
    setModalVisible(true);
  };

  const closeModal = () => {
    setMerchant("");
    setAmount("");
    setCategory("Food & Drinks");
    setPaymentMethod("Cash");
    setIsEditing(false);
    setEditingId(null);
    setModalVisible(false);
  };

  const formatGroupDate = (dateString: string) => {
    const txDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (txDate.toDateString() === today.toDateString()) return "Today";
    if (txDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return txDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const filteredTransactions = transactions.filter(
    (item) =>
      item.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTransactions = filteredTransactions.reduce((groups: any, item) => {
    const group = formatGroupDate(item.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {});

  const sections = Object.keys(groupedTransactions);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* --- Header & Search Bar Layout --- */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transactions</Text>
        <View style={[styles.searchBarContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Ionicons name="search-outline" size={18} color={colors.text + "80"} style={styles.searchIcon} />
          <TextInput
            placeholder="Search merchant or category..."
            placeholderTextColor={colors.text + "66"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {/* --- Main Feed --- */}
      {loading && transactions.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary || "#007AFF"} />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchTransactions();
          }}
          renderItem={({ item: dateGroup }) => (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: colors.text + "99" }]}>{dateGroup}</Text>
              <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {groupedTransactions[dateGroup].map((tx: any, index: number, arr: any[]) => {
                  const isExpanded = expandedId === tx.id;
                  const isLastItem = index === arr.length - 1;
                  const config = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG["Miscellaneous"];
                  const txTime = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <View key={tx.id} style={[styles.rowWrapper, { borderBottomColor: colors.border }, isLastItem && { borderBottomWidth: 0 }]}>
                      <Pressable style={styles.transactionRow} onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setExpandedId(isExpanded ? null : tx.id);
                      }}>
                        <View style={styles.rowLeft}>
                          <View style={[styles.iconCircle, { backgroundColor: config.color + "1A" }]}>
                            <Ionicons name={config.icon} size={20} color={config.color} />
                          </View>
                          <View style={styles.textContainer}>
                            <Text style={[styles.merchantText, { color: colors.text }]} numberOfLines={1}>{tx.merchant}</Text>
                            <Text style={[styles.categoryText, { color: colors.text + "80" }]}>{tx.category}</Text>
                          </View>
                        </View>
                        <View style={styles.rowRight}>
                          <Text style={[styles.amountText, { color: colors.text }]}>₱{Number(tx.amount).toFixed(2)}</Text>
                          <Text style={[styles.timeText, { color: colors.text + "66" }]}>{txTime}</Text>
                        </View>
                      </Pressable>

                      {/* Expandable Control Panel */}
                      {isExpanded && (
                        <View style={styles.expandedPanel}>
                          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                          <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                              <Text style={[styles.detailLabel, { color: colors.text + "66" }]}>Payment Method</Text>
                              <Text style={[styles.detailValue, { color: colors.text }]}>{tx.payment_method}</Text>
                            </View>
                            
                            <View style={styles.actionButtonsGroup}>
                              <Pressable style={[styles.actionBtn, { backgroundColor: colors.background }]} onPress={() => startEditTransaction(tx)}>
                                <Ionicons name="create-outline" size={15} color={colors.primary || "#007AFF"} />
                                <Text style={[styles.actionBtnText, { color: colors.primary || "#007AFF" }]}>Edit</Text>
                              </Pressable>
                              
                              <Pressable style={[styles.actionBtn, { backgroundColor: colors.background }]} onPress={() => handleDeleteTransaction(tx.id)}>
                                <Ionicons name="trash-outline" size={15} color="#FF3B30" />
                                <Text style={[styles.actionBtnText, { color: "#FF3B30" }]}>Delete</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.text + "33"} />
              <Text style={[styles.emptyText, { color: colors.text + "66" }]}>No transactions recorded yet.</Text>
            </View>
          }
        />
      )}

      {/* --- DYNAMIC SLIDE FORM PANEL MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{isEditing ? "Edit Transaction" : "Add Transaction"}</Text>
              <Pressable onPress={closeModal} disabled={loading}>
                <Ionicons name="close-circle" size={24} color={colors.text + "66"} />
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text + "B3" }]}>Store / Merchant</Text>
            <TextInput 
              placeholder="e.g., McDonald's, Shell, Grab" 
              placeholderTextColor={colors.text + "4D"} 
              value={merchant} 
              onChangeText={setMerchant} 
              editable={!loading} 
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
            />

            <Text style={[styles.inputLabel, { color: colors.text + "B3" }]}>Amount (₱)</Text>
            <TextInput 
              placeholder="0.00" 
              placeholderTextColor={colors.text + "4D"} 
              keyboardType="numeric" 
              value={amount} 
              onChangeText={setAmount} 
              editable={!loading} 
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
            />

            <Text style={[styles.inputLabel, { color: colors.text + "B3" }]}>Category</Text>
            <View style={styles.selectorGroup}>
              {Object.keys(CATEGORY_CONFIG).map((cat) => {
                const isSelected = category === cat;
                return (
                  <Pressable 
                    key={cat} 
                    style={[
                      styles.selectorBadge, 
                      { backgroundColor: colors.background }, 
                      isSelected && { backgroundColor: colors.primary || "#007AFF" }
                    ]} 
                    onPress={() => setCategory(cat)} 
                    disabled={loading}
                  >
                    <Text style={[styles.badgeText, { color: colors.text + "99" }, isSelected && { color: "#ffffff", fontWeight: "600" }]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.text + "B3" }]}>Payment Method</Text>
            <View style={styles.selectorGroup}>
              {["Cash", "GCash", "Maya", "Credit Card"].map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <Pressable 
                    key={method} 
                    style={[
                      styles.selectorBadge, 
                      { backgroundColor: colors.background }, 
                      isSelected && { backgroundColor: colors.primary || "#007AFF" }
                    ]} 
                    onPress={() => setPaymentMethod(method)} 
                    disabled={loading}
                  >
                    <Text style={[styles.badgeText, { color: colors.text + "99" }, isSelected && { color: "#ffffff", fontWeight: "600" }]}>
                      {method}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSaveTransaction} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.saveBtnText}>{isEditing ? "Update Transaction" : "Save Transaction"}</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 24, paddingTop: 5, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "700", marginBottom: 14, marginTop: Platform.OS === "ios" ? 20 : 40 },
  searchBarContainer: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionBlock: { marginBottom: 20 },
  sectionHeading: { fontSize: 14, fontWeight: "600", marginBottom: 8, paddingLeft: 4 },
  groupCard: { borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, overflow: "hidden" },
  rowWrapper: { borderBottomWidth: 1 },
  transactionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  textContainer: { flex: 1, justifyContent: "center" },
  merchantText: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  categoryText: { fontSize: 12 },
  rowRight: { alignItems: "flex-end", marginLeft: 10 },
  amountText: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  timeText: { fontSize: 12 },
  expandedPanel: { paddingBottom: 14 },
  dividerLine: { height: 1, marginBottom: 12 },
  detailsGrid: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: "500", textTransform: "uppercase", marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  actionButtonsGroup: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "flex-end" },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 10 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  selectorGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 6 },
  selectorBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: "500" },
  saveBtn: { backgroundColor: "#34C759", borderRadius: 12, alignItems: "center", marginTop: 24, paddingVertical: 14 },
  saveBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});