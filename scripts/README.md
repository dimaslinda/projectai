# Scripts Directory

This directory contains organized utility scripts for monitoring, debugging, and maintaining the ProjectAI application.

## Directory Structure

```
scripts/
├── monitoring/          # Scripts for monitoring and debugging
│   ├── session_checker.php     # Check current session configuration
│   ├── session_auditor.php     # Audit all chat sessions and authorization
│   ├── session_finder.php      # Find active sessions by specific criteria
│   └── metadata_analyzer.php   # Comprehensive metadata analysis tool
└── maintenance/         # Scripts for maintenance and repair
    ├── session_fixer.php       # Fix chat session sharing configuration
    └── cache_manager.php       # Clear cache and test session access
```

## Monitoring Scripts

### session_checker.php
- **Purpose**: Monitor current session configuration
- **Features**: 
  - Checks session configuration
  - Searches for sessions matching "Gemini", "Flash", or "Image"
  - Displays recent messages
- **Usage**: `php scripts/monitoring/session_checker.php`

### session_auditor.php
- **Purpose**: Audit all chat sessions and authorization
- **Features**:
  - Lists all chat sessions
  - Shows session details and ownership
  - Tests authorization permissions
- **Usage**: `php scripts/monitoring/session_auditor.php`

### session_finder.php
- **Purpose**: Find active sessions by specific criteria
- **Features**:
  - Searches for sessions based on message content
  - Displays session details
  - Checks image generation capabilities
- **Usage**: `php scripts/monitoring/session_finder.php`

### metadata_analyzer.php
- **Purpose**: Comprehensive metadata analysis tool
- **Features**:
  - Analyzes image metadata in database
  - Checks recent chat history metadata
  - Examines specific metadata patterns
  - Generates summary reports
- **Usage**: 
  ```bash
  php scripts/monitoring/metadata_analyzer.php [command] [options]
  
  Commands:
  - images     # Analyze only image metadata
  - recent     # Analyze only recent metadata  
  - examine    # Examine specific metadata
  - summary    # Generate summary report only
  - all        # Run all analyses (default)
  ```

## Maintenance Scripts

### session_fixer.php
- **Purpose**: Enforce private-only chat sessions
- **Features**:
  - Disables any sharing (`is_shared` forced to false)
  - Clears `shared_with_roles` for all sessions
  - Reports fixes applied per session
- **Usage**: `php scripts/maintenance/session_fixer.php`

### cache_manager.php
- **Purpose**: Clear cache and test session access
- **Features**:
  - Clears application cache
  - Clears configuration cache
  - Clears route cache
  - Clears view cache
  - Tests session access after clearing
- **Usage**: `php scripts/maintenance/cache_manager.php`

## Best Practices

1. **Run from project root**: Always execute scripts from the project root directory
2. **Check permissions**: Ensure proper file permissions before running maintenance scripts
3. **Backup first**: Consider backing up data before running maintenance scripts
4. **Monitor logs**: Check application logs after running scripts
5. **Test environment**: Test scripts in development environment first

## Troubleshooting

If you encounter issues:

1. Ensure Laravel environment is properly configured
2. Check database connectivity
3. Verify file permissions
4. Review application logs
5. Ensure all dependencies are installed

## Migration Notes

These scripts were reorganized from the root directory to improve project structure:

- `check_current_session.php` → `scripts/monitoring/session_checker.php`
- `check_existing_sessions.php` → `scripts/monitoring/session_auditor.php`
- `find_active_session.php` → `scripts/monitoring/session_finder.php`
- `fix_chat_sessions.php` → `scripts/maintenance/session_fixer.php`
- `clear_cache_and_test.php` → `scripts/maintenance/cache_manager.php`
- Multiple metadata files → `scripts/monitoring/metadata_analyzer.php` (consolidated)