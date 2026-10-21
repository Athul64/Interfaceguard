package com.interfaceguard;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.ast.stmt.ReturnStmt;
import com.github.javaparser.ast.stmt.Statement;
import com.github.javaparser.ast.stmt.ThrowStmt;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Extractor {
    public static void main(String[] args) {
        JSONObject response = new JSONObject();
        JSONArray interfacesJson = new JSONArray();
        JSONArray classesJson = new JSONArray();
        JSONArray parseErrors = new JSONArray();

        if (args.length == 0) {
            response.put("error", "No file or directory provided");
            response.put("interfaces", interfacesJson);
            response.put("classes", classesJson);
            System.out.println(response.toString());
            return;
        }

        List<Path> filesToParse = new ArrayList<>();
        for (String arg : args) {
            Path p = Paths.get(arg);
            if (Files.isDirectory(p)) {
                try (Stream<Path> stream = Files.walk(p)) {
                    List<Path> javaFiles = stream
                            .filter(Files::isRegularFile)
                            .filter(f -> f.toString().endsWith(".java"))
                            .collect(Collectors.toList());
                    filesToParse.addAll(javaFiles);
                } catch (Exception e) {
                    parseErrors.put("Failed to walk directory: " + p + " - " + e.getMessage());
                }
            } else if (Files.isRegularFile(p) && p.toString().endsWith(".java")) {
                filesToParse.add(p);
            }
        }

        for (Path file : filesToParse) {
            try {
                String source = new String(Files.readAllBytes(file));
                CompilationUnit cu = StaticJavaParser.parse(source);
                String packageName = cu.getPackageDeclaration()
                        .map(pd -> pd.getNameAsString())
                        .orElse("");

                List<ClassOrInterfaceDeclaration> types = cu.findAll(ClassOrInterfaceDeclaration.class);
                for (ClassOrInterfaceDeclaration type : types) {
                    if (type.isInterface()) {
                        JSONObject iface = new JSONObject();
                        iface.put("name", type.getNameAsString());
                        iface.put("package", packageName);
                        iface.put("file_path", file.toString().replace('\\', '/'));

                        JSONArray extendsArr = new JSONArray();
                        type.getExtendedTypes().forEach(t -> extendsArr.put(t.getNameAsString()));
                        iface.put("extends", extendsArr);

                        JSONArray methods = new JSONArray();
                        for (MethodDeclaration m : type.getMethods()) {
                            JSONObject method = new JSONObject();
                            method.put("name", m.getNameAsString());
                            method.put("return_type", m.getTypeAsString());
                            method.put("params", m.getParameters().size());

                            JSONArray paramTypes = new JSONArray();
                            JSONArray paramNames = new JSONArray();
                            for (Parameter param : m.getParameters()) {
                                paramTypes.put(param.getTypeAsString());
                                paramNames.put(param.getNameAsString());
                            }
                            method.put("param_types", paramTypes);
                            method.put("param_names", paramNames);
                            method.put("is_default", m.isDefault());
                            method.put("is_static", m.isStatic());
                            if (m.getRange().isPresent()) {
                                method.put("start_line", m.getRange().get().begin.line);
                                method.put("end_line", m.getRange().get().end.line);
                            }
                            methods.put(method);
                        }
                        iface.put("methods", methods);
                        interfacesJson.put(iface);
                    } else {
                        // Class
                        JSONObject cls = new JSONObject();
                        cls.put("name", type.getNameAsString());
                        cls.put("package", packageName);
                        cls.put("file_path", file.toString().replace('\\', '/'));

                        JSONArray implArr = new JSONArray();
                        type.getImplementedTypes().forEach(t -> implArr.put(t.getNameAsString()));
                        cls.put("implements", implArr);

                        JSONArray extArr = new JSONArray();
                        type.getExtendedTypes().forEach(t -> extArr.put(t.getNameAsString()));
                        cls.put("extends", extArr);

                        JSONArray fields = new JSONArray();
                        for (FieldDeclaration f : type.getFields()) {
                            f.getVariables().forEach(v -> {
                                JSONObject fieldObj = new JSONObject();
                                fieldObj.put("name", v.getNameAsString());
                                fieldObj.put("type", v.getTypeAsString());
                                fields.put(fieldObj);
                            });
                        }
                        cls.put("fields", fields);

                        JSONArray methods = new JSONArray();
                        for (MethodDeclaration m : type.getMethods()) {
                            JSONObject method = new JSONObject();
                            method.put("name", m.getNameAsString());
                            method.put("return_type", m.getTypeAsString());
                            method.put("params", m.getParameters().size());

                            JSONArray paramTypes = new JSONArray();
                            for (Parameter param : m.getParameters()) {
                                paramTypes.put(param.getTypeAsString());
                            }
                            method.put("param_types", paramTypes);

                            if (m.getRange().isPresent()) {
                                method.put("start_line", m.getRange().get().begin.line);
                                method.put("end_line", m.getRange().get().end.line);
                            }

                            // Body analysis for ISP detection and metrics
                            boolean isEmpty = false;
                            boolean isNoOp = false;
                            boolean isExceptionStub = false;
                            boolean isPlaceholder = false;
                            String stubDetail = "";

                            if (m.getBody().isEmpty()) {
                                isEmpty = true;
                            } else {
                                BlockStmt body = m.getBody().get();
                                List<Statement> stmts = body.getStatements();
                                if (stmts.isEmpty()) {
                                    isEmpty = true;
                                    isNoOp = true;
                                } else if (stmts.size() == 1) {
                                    Statement s = stmts.get(0);
                                    if (s instanceof ThrowStmt) {
                                        isExceptionStub = true;
                                        stubDetail = ((ThrowStmt) s).getExpression().toString();
                                    } else if (s instanceof ReturnStmt) {
                                        ReturnStmt rs = (ReturnStmt) s;
                                        String expr = rs.getExpression().map(Object::toString).orElse("");
                                        if (expr.equals("null") || expr.equals("0") || expr.equals("false")
                                                || expr.equals("new byte[0]") || expr.equals("\"\"") || expr.equals("Collections.emptyList()")) {
                                            isPlaceholder = true;
                                            stubDetail = "returns " + expr;
                                        }
                                    }
                                }

                                if (!isExceptionStub && !isPlaceholder && body.getAllContainedComments().size() > 0 && stmts.isEmpty()) {
                                    isNoOp = true;
                                    stubDetail = "empty body with comment";
                                }

                                // Invocations inside method
                                JSONArray calls = new JSONArray();
                                for (MethodCallExpr call : body.findAll(MethodCallExpr.class)) {
                                    calls.put(call.getNameAsString());
                                }
                                method.put("calls", calls);
                            }

                            method.put("is_empty", isEmpty);
                            method.put("is_no_op", isNoOp);
                            method.put("is_exception_stub", isExceptionStub);
                            method.put("is_placeholder", isPlaceholder);
                            method.put("stub_detail", stubDetail);

                            methods.put(method);
                        }
                        cls.put("methods", methods);
                        classesJson.put(cls);
                    }
                }
            } catch (Exception e) {
                parseErrors.put("Parse error in " + file + ": " + e.getMessage());
            }
        }

        response.put("status", "ok");
        response.put("interfaces", interfacesJson);
        response.put("classes", classesJson);
        response.put("errors", parseErrors);

        System.out.println(response.toString());
    }
}