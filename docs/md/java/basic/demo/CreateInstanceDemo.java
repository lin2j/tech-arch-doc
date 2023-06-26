package com.jia;


import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

class User {
    private String name;
    private int age;

    public User(){}
    public User(int age){this.age = age;}

    public static void worldState() {
        System.out.println("The world is functioning normally");
    }

    public void say(){
        System.out.println("hello");
    }

    public void say(String msg){
        System.out.println(msg);
    }

    public int age(){
        return this.age;
    }
	
	public String toString(){
		return this.name + "--" + this.age;
	}
}

/**
 * @author linjinjia
 * @date 2021/8/18 15:27
 */
public class CreateInstanceDemo {

    public static void main(String[] args) {
        try {
            Class cl = Class.forName("com.jia.User");
            // 通过默认构造器
            Object user = cl.newInstance();
            Method m1 = cl.getMethod("say");
            m1.invoke(user);

            // 通过有参构造器
            Constructor constructor = cl.getConstructor(int.class);
            Object user2 = constructor.newInstance(14);
            // 查看字段值
            Field field = cl.getDeclaredField("age");
            field.setAccessible(true); // 设置为可访问
            System.out.println(field.get(user2));
			field.set(user2, 20);
			System.out.println(user2);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
