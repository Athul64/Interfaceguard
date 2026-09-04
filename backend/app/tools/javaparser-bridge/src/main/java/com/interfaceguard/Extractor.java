package com.interfaceguard;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class Extractor {
    public static void main(String[] args) throws Exception {
        String filePath = args[0];
        String source = new String(Files.readAllBytes(Paths.get(filePath)));

        JSONArray result = new JSONArray();
        try {
            CompilationUnit cu = StaticJavaParser.parse(source);
            List<ClassOrInterfaceDeclaration> types = cu.findAll(ClassOrInterfaceDeclaration.class);
            for (ClassOrInterfaceDeclaration type : types) {
                if (!type.isInterface()) continue;
                JSONObject iface = new JSONObject();
                iface.put("name", type.getNameAsString());
                JSONArray methods = new JSONArray();
                for (MethodDeclaration m : type.getMethods()) {
                    JSONObject method = new JSONObject();
                    method.put("name", m.getNameAsString());
                    method.put("params", m.getParameters().size());
                    methods.put(method);
                }
                iface.put("methods", methods);
                result.put(iface);
            }
        } catch (Exception e) {
            // Parse failure -> empty result, same contract as the javalang version
        }

        System.out.println(result.toString());
    }
}