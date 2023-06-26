import java.util.*;
import java.lang.reflect.*;

/**
 * @author linjinjia
 * @date 2021/8/17 20:14
 */
public class ClassInfoPrinter {

    public static void main(String[] args) {
		String classPath;
		if(args.length > 0){
			classPath = args[0];
		} else {
			Scanner scanner = new Scanner(System.in);
			System.out.println("输入类的全限定名 (例如 java.util.Date): ");
			classPath = scanner.next();
		}
		try{
			StringBuilder classInfo = new StringBuilder();
			Class clazz = Class.forName(classPath);
			Class superCl = clazz.getSuperclass();
			String modifier = Modifier.toString(clazz.getModifiers());
			classInfo.append(modifier).append(" class ").append(clazz.getName());
			if(superCl != null && superCl != Object.class) {
				classInfo.append(" extend ").append(superCl.getName());
			}
			classInfo.append(" {\n");
			classInfo.append(fieldInfo(clazz)).append("\n");
			classInfo.append(constructorInfo(clazz)).append("\n");
			classInfo.append(methodInfo(clazz));
			
			classInfo.append("}");
			System.out.println(classInfo);
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}
    }

    /**
     * 打印类的字段
     */
    private static String fieldInfo(Class clazz) {
        Field[] fields = clazz.getDeclaredFields();
        StringBuilder fieldInfo = new StringBuilder();
        for (Field field : fields) {
			fieldInfo.append("    ");
            // 修饰符
            String modifier = Modifier.toString(field.getModifiers());
            // 字段类型
            Class fieldType = field.getType();
            if (modifier.length() > 0) {
                fieldInfo.append(modifier).append(" ");
            }
            fieldInfo.append(fieldType.getName()).append(" ");
            // 字段名
            fieldInfo.append(field.getName()).append(";\n");
        }
        return fieldInfo.toString();
    }

    /**
     * 打印构造器
     */
    private static String constructorInfo(Class clazz) {
        Constructor[] constructors = clazz.getDeclaredConstructors();
        StringBuilder constructorInfo = new StringBuilder();
        for (Constructor constructor : constructors) {
			constructorInfo.append("    ");
            // 修饰符
            String modifier = Modifier.toString(constructor.getModifiers());
            if (modifier.length() > 0) {
                constructorInfo.append(modifier).append(" ");
            }
            // 名称和参数
            constructorInfo.append(constructor.getName()).append("(");
            Class[] paramTypes = constructor.getParameterTypes();
            if (paramTypes.length > 0) {
                for (Class paramType : paramTypes) {
                    constructorInfo.append(paramType.getName()).append(",");
                }
                // 删掉最后一个参数的逗号
                constructorInfo.deleteCharAt(constructorInfo.length() - 1);
            }
            constructorInfo.append(");\n");
        }
        return constructorInfo.toString();
    }

    /**
     * 方法信息
     */
    private static String methodInfo(Class clazz) {
        StringBuilder methodInfo = new StringBuilder();
        Method[] methods = clazz.getDeclaredMethods();
        for (Method m : methods) {
			methodInfo.append("    ");
            String modifier = Modifier.toString(m.getModifiers());
            if (modifier.length() > 0) {
                methodInfo.append(modifier).append(" ");
            }
            Class returnType = m.getReturnType();
            methodInfo.append(returnType.getName()).append(" ");
            methodInfo.append(m.getName()).append("(");
            Class[] paramTypes = m.getParameterTypes();
            if (paramTypes.length > 0) {
                for (Class paramType : paramTypes) {
                    methodInfo.append(paramType.getName()).append(",");
                }
                // 删掉最后一个参数的逗号
                methodInfo.deleteCharAt(methodInfo.length() - 1);
            }
            methodInfo.append(");\n");
        }
        return methodInfo.toString();
    }
}
