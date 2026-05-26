import { Color, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    
    <Tabs screenOptions={{tabBarActiveTintColor:'#3B82F6', tabBarInactiveTintColor: '#9CA3AF',headerShown:false}}>
        <Tabs.Screen 
        name="home"
        options={{
            title:"Home",
            tabBarIcon:({color,size})=>(
                <Ionicons name="home-outline" size={size} color={color}/>
            )
        }}
        />
        <Tabs.Screen name="files" options={{title:"Files", tabBarIcon:({color,size})=>(<Ionicons name="folder-outline" color={color} size={size}/>)}}/>
        <Tabs.Screen name="favourites" options={{title:"Favourites", tabBarIcon:({color,size})=>(<Ionicons name="heart-outline" color={color} size={size}/>)}}/>
        <Tabs.Screen name="settings" options={{title:"Settings", tabBarIcon:({color,size})=>(<Ionicons name="settings-outline" color={color} size={size}/>)}}/>

    </Tabs>
  );
}