package com.lumina.api.middleware;
import com.lumina.api.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice @Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> notFound(ResourceNotFoundException e){ return ResponseEntity.status(404).body(ApiResponse.error("NOT_FOUND",e.getMessage())); }
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> business(BusinessException e){ return ResponseEntity.status(e.getStatus()).body(ApiResponse.error(e.getCode(),e.getMessage())); }
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> conflict(ConflictException e){ return ResponseEntity.status(409).body(ApiResponse.error("CONFLICT",e.getMessage())); }
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> badCreds(BadCredentialsException e){ return ResponseEntity.status(401).body(ApiResponse.error("INVALID_CREDENTIALS","Invalid email or password")); }
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> denied(AccessDeniedException e){ return ResponseEntity.status(403).body(ApiResponse.error("ACCESS_DENIED","Insufficient permissions")); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String,String>>> validation(MethodArgumentNotValidException e){
        var errors=e.getBindingResult().getFieldErrors().stream().collect(Collectors.toMap(FieldError::getField,f->f.getDefaultMessage()!=null?f.getDefaultMessage():"Invalid",(a,b)->a));
        return ResponseEntity.status(422).body(ApiResponse.<Map<String,String>>builder().success(false).error(new ApiResponse.ApiError("VALIDATION_ERROR","Validation failed",errors)).build());
    }
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiResponse<Void>> rateLimit(RateLimitExceededException e){ return ResponseEntity.status(429).body(ApiResponse.error("RATE_LIMITED",e.getMessage())); }
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiResponse<Void>> malformed(Exception e){
        return ResponseEntity.badRequest().body(ApiResponse.error("INVALID_REQUEST","Requisição inválida"));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> generic(Exception e){ log.error("Unhandled error",e); return ResponseEntity.status(500).body(ApiResponse.error("INTERNAL_ERROR","An unexpected error occurred")); }

    // Exception types
    public static class ResourceNotFoundException extends RuntimeException { public ResourceNotFoundException(String m){super(m);} public ResourceNotFoundException(String r,Object id){super(r+" not found: "+id);} }
    public static class BusinessException extends RuntimeException { private final String code; private final HttpStatus status; public BusinessException(String c,String m,HttpStatus s){super(m);this.code=c;this.status=s;} public String getCode(){return code;} public HttpStatus getStatus(){return status;} }
    public static class ConflictException extends RuntimeException { public ConflictException(String m){super(m);} }
    public static class RateLimitExceededException extends RuntimeException { public RateLimitExceededException(String m){super(m);} }
}
