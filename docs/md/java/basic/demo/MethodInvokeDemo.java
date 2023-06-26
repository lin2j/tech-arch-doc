package com.jia;

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
}

/**
 * @author linjinjia
 * @date 2021/8/18 20:21
 */
public class MethodInvokeDemo {

    public static void main(String[] args) {
        User user = new User(14);
        Class cl = user.getClass();
        try {
			// 无参方法
            Method m1 = cl.getMethod("say");
            m1.invoke(user);

			// 有参方法
            Method m2 = cl.getMethod("say", String.class);
            m2.invoke(user, "java");
			
			// 静态方法
			Method m3 = cl.getMethod("worldState");
			m3.invoke(null);
			
			// 基本类型返回值变成包装类型
			Method m4 = cl.getMethod("age");
			Object obj = m4.invoke(user);
			System.out.println(obj);
			System.out.println( obj instanceof Integer);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
