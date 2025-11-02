import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import PropTypes from "prop-types";
import { TouchableOpacity } from "react-native";
import EventsListScreen from "../screens/EventsListScreen";
import MapScreen from "../screens/MapScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatScreen from "../screens/ChatScreen";

function TabBarIcon({ name, color, size }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function HeaderEditButton({ navigation }) {
  return (
    <TouchableOpacity
      style={{ marginRight: 12 }}
      onPress={() => navigation.navigate("Profile", { edit: true })}
    >
      <Ionicons name="create-outline" size={20} color="#8E2DE2" />
    </TouchableOpacity>
  );
}

// simple runtime check for navigation prop
HeaderEditButton.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired })
    .isRequired,
};

const Tab = createBottomTabNavigator();

function getTabBarIcon(routeName, color, size) {
  let name = "list";
  if (routeName === "Map") name = "map";
  if (routeName === "Chat") name = "chatbubble-ellipses";
  if (routeName === "Profile") name = "person";
  return <TabBarIcon name={name} color={color} size={size} />;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => getTabBarIcon(route.name, color, size),
      })}
    >
      <Tab.Screen
        name="Events"
        component={EventsListScreen}
        options={{ title: "Sự kiện" }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: "Bản đồ" }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Chat AI", headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: "Cá nhân",
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <HeaderEditButton navigation={navigation} />,
        })}
      />
    </Tab.Navigator>
  );
}

TabBarIcon.propTypes = {
  name: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.number,
};
